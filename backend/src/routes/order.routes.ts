import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth';
import {
  emitOrderUpdateToCustomer,
  emitNewOrderToVendor,
  emitInventoryAlert,
  emitNotification,
} from '../socket';

const router = Router();

// Generate random 4-digit OTP for pickup verification
const generatePickupOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate human-readable Order Number e.g. "CAN-84920"
const generateOrderNumber = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CAN-${rand}`;
};

// POST /api/orders (Place Order)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const placeOrderSchema = z.object({
      paymentMethod: z.enum(['CASH', 'UPI']).default('UPI'),
      notes: z.string().optional(),
      items: z
        .array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().min(1),
          })
        )
        .optional(), // If not passed, use cart
    });

    const { paymentMethod, notes, items: directItems } = placeOrderSchema.parse(req.body);
    const userId = req.user!.id;

    // Get order items from cart if directItems not supplied
    let orderItemsToProcess: { productId: string; quantity: number }[] = [];

    if (directItems && directItems.length > 0) {
      orderItemsToProcess = directItems;
    } else {
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!userCart || userCart.items.length === 0) {
        res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before checkout.' });
        return;
      }

      orderItemsToProcess = userCart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
    }

    // Fetch products from database to calculate trusted prices and check availability & vendor
    const productIds = orderItemsToProcess.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        vendor: true,
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ success: false, message: 'One or more items in your cart no longer exist.' });
      return;
    }

    // Check availability
    for (const p of products) {
      if (!p.isAvailable) {
        res.status(400).json({
          success: false,
          message: `"${p.name}" is currently sold out and unavailable.`,
        });
        return;
      }
      if (!p.vendor.isOpen) {
        res.status(400).json({
          success: false,
          message: `Stall "${p.vendor.stallName}" is currently closed.`,
        });
        return;
      }
    }

    // Single vendor check for clarity
    const vendorId = products[0].vendorId;
    const isMultiVendor = products.some((p) => p.vendorId !== vendorId);
    if (isMultiVendor) {
      res.status(400).json({
        success: false,
        message: 'All items in an order must be from the same canteen stall.',
      });
      return;
    }

    // Calculate trusted prices and totals on the backend
    let subtotal = 0;
    let maxPrepTime = 15;

    const computedItems = orderItemsToProcess.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      if (product.preparationTime > maxPrepTime) {
        maxPrepTime = product.preparationTime;
      }

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const finalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const pickupOtp = generatePickupOtp();
    const orderNumber = generateOrderNumber();

    // Run order creation in database transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          vendorId,
          status: 'PLACED',
          totalAmount: Math.round(subtotal * 100) / 100,
          taxAmount,
          finalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'UPI' ? 'COMPLETED' : 'PENDING',
          pickupOtp,
          notes: notes?.trim() || null,
          estimatedPrepMinutes: maxPrepTime,
          items: {
            create: computedItems.map((ci) => ({
              productId: ci.productId,
              productName: ci.productName,
              unitPrice: ci.unitPrice,
              quantity: ci.quantity,
              subtotal: ci.subtotal,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          vendor: true,
          user: {
            select: { id: true, name: true, email: true, phone: true, department: true },
          },
        },
      });

      // Create Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod,
          status: paymentMethod === 'UPI' ? 'COMPLETED' : 'PENDING',
          amount: finalAmount,
          transactionId: paymentMethod === 'UPI' ? `UPI-${Date.now()}-${Math.floor(Math.random() * 1000)}` : null,
          paidAt: paymentMethod === 'UPI' ? new Date() : null,
        },
      });

      // Clear customer's cart
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // Create notification for customer
      await tx.notification.create({
        data: {
          userId,
          title: 'Order Placed Successfully!',
          message: `Your order #${orderNumber} for ₹${finalAmount} has been placed with ${products[0].vendor.stallName}.`,
          type: 'ORDER_STATUS',
          link: `/orders/${newOrder.id}`,
        },
      });

      return newOrder;
    });

    // Notify vendor stall via Socket.IO
    emitNewOrderToVendor(vendorId, order);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders (List orders based on role / query)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, vendorId, limit = '50', page = '1' } = req.query;
    const role = req.user!.role;
    const userId = req.user!.id;

    const where: any = {};

    if (role === 'STUDENT' || role === 'FACULTY') {
      // Customers only see their own orders
      where.userId = userId;
    } else if (role === 'VENDOR') {
      // Vendors see their stall's orders
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
      where.vendorId = vendor.id;
    } else if (role === 'ADMIN') {
      // Admin can filter by vendorId
      if (vendorId && typeof vendorId === 'string') {
        where.vendorId = vendorId;
      }
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: true },
          },
          vendor: {
            select: { id: true, stallName: true, location: true, phone: true },
          },
          user: {
            select: { id: true, name: true, email: true, phone: true, department: true, roomNumber: true },
          },
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: totalCount,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id (Detailed Order details / invoice)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
        vendor: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            department: true,
            roomNumber: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Permission check
    if (role === 'STUDENT' || role === 'FACULTY') {
      if (order.userId !== userId) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
        return;
      }
    } else if (role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      if (!vendor || order.vendorId !== vendor.id) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
        return;
      }
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/cancel (Customer, Vendor, or Admin cancels order)
router.post('/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const userId = req.user!.id;
    const role = req.user!.role;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
        },
        vendor: true,
        user: true,
        payment: true,
      },
    });

    if (!existingOrder) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const isOwnerCustomer = existingOrder.userId === userId;
    const isOwnerVendor = role === 'VENDOR' && existingOrder.vendor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isOwnerCustomer && !isOwnerVendor && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this order' });
      return;
    }

    // Customer cancellation rules
    if (isOwnerCustomer && !isAdmin && !isOwnerVendor) {
      if (existingOrder.status === 'COLLECTED') {
        res.status(400).json({ success: false, message: 'Completed and collected orders cannot be cancelled.' });
        return;
      }
      if (existingOrder.status === 'READY') {
        res.status(400).json({ success: false, message: 'Your order is already prepared and ready at the counter. Please visit the counter to cancel.' });
        return;
      }
      if (existingOrder.status === 'PREPARING') {
        res.status(400).json({ success: false, message: 'Kitchen has already started cooking your meal. Please contact the counter directly.' });
        return;
      }
      if (existingOrder.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Order is already cancelled.' });
        return;
      }
    }

    if (existingOrder.status === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Order is already cancelled.' });
      return;
    }

    const cancellationReason = reason?.trim() || (isOwnerCustomer ? 'Cancelled by customer' : 'Cancelled by canteen vendor');

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update payment status to REFUNDED or FAILED
      await tx.payment.updateMany({
        where: { orderId: id },
        data: {
          status: existingOrder.payment?.status === 'COMPLETED' ? 'REFUNDED' : 'FAILED',
        },
      });

      // 2. Update order status to CANCELLED
      const orderResult = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledReason: cancellationReason,
        },
        include: {
          items: { include: { product: true } },
          vendor: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
          payment: true,
        },
      });

      // 3. If ingredients were deducted for this order, restore inventory
      const previousDeductions = await tx.inventoryTransaction.findMany({
        where: {
          orderId: id,
          type: 'ORDER_CONSUMPTION',
        },
        include: { ingredient: true },
      });

      for (const deduction of previousDeductions) {
        const restoreQty = Math.abs(deduction.quantity);
        const currentStock = deduction.ingredient.quantity;
        const restoredStock = Math.round((currentStock + restoreQty) * 100) / 100;

        await tx.ingredient.update({
          where: { id: deduction.ingredientId },
          data: { quantity: restoredStock },
        });

        await tx.inventoryTransaction.create({
          data: {
            ingredientId: deduction.ingredientId,
            orderId: id,
            type: 'RESTOCK',
            quantity: restoreQty,
            previousStock: currentStock,
            newStock: restoredStock,
            note: `Restocked due to cancellation of Order #${existingOrder.orderNumber}`,
          },
        });
      }

      // 4. Notifications
      await tx.notification.create({
        data: {
          userId: existingOrder.userId,
          title: `Order #${existingOrder.orderNumber} Cancelled`,
          message: `Your order was cancelled. Reason: ${cancellationReason}.${existingOrder.paymentMethod === 'UPI' ? ' Debited funds will be refunded.' : ''}`,
          type: 'ORDER_STATUS',
          link: `/orders/${existingOrder.id}`,
        },
      });

      if (!isOwnerVendor) {
        await tx.notification.create({
          data: {
            userId: existingOrder.vendor.userId,
            title: `Order #${existingOrder.orderNumber} Cancelled`,
            message: `${existingOrder.user.name} cancelled Order #${existingOrder.orderNumber}. Reason: ${cancellationReason}`,
            type: 'ORDER_STATUS',
          },
        });
      }

      return orderResult;
    });

    emitOrderUpdateToCustomer(existingOrder.userId, updatedOrder);
    emitNewOrderToVendor(existingOrder.vendorId, updatedOrder);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status (Vendor/Admin updates order status & handles ingredient deduction)
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const statusSchema = z.object({
        status: z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED']),
        cancelledReason: z.string().optional(),
      });

      const { status: newStatus, cancelledReason } = statusSchema.parse(req.body);

      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  ingredients: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
          vendor: true,
          user: true,
          payment: true,
        },
      });

      if (!existingOrder) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      // Check vendor ownership
      if (req.user!.role === 'VENDOR' && existingOrder.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const previousStatus = existingOrder.status;

      // INVENTORY DEDUCTION RULE:
      // When order transitions from PLACED -> ACCEPTED (or PREPARING),
      // deduct ingredients defined in each product's recipe.
      const shouldDeductIngredients =
        (newStatus === 'ACCEPTED' || newStatus === 'PREPARING') &&
        previousStatus === 'PLACED';

      const updatedOrder = await prisma.$transaction(async (tx) => {
        // If transitioning to COLLECTED, ensure payment status is completed if CASH
        let paymentStatusUpdate: any = undefined;
        if (newStatus === 'COLLECTED') {
          paymentStatusUpdate = 'COMPLETED';
          await tx.payment.updateMany({
            where: { orderId: id },
            data: { status: 'COMPLETED', paidAt: new Date() },
          });
        }

        const orderResult = await tx.order.update({
          where: { id },
          data: {
            status: newStatus,
            cancelledReason: cancelledReason || existingOrder.cancelledReason,
            ...(paymentStatusUpdate ? { paymentStatus: paymentStatusUpdate } : {}),
          },
          include: {
            items: { include: { product: true } },
            vendor: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
            payment: true,
          },
        });

        // Execute inventory deduction if required
        if (shouldDeductIngredients) {
          const ingredientUsageMap = new Map<string, { ingredient: any; totalQty: number }>();

          for (const item of existingOrder.items) {
            for (const recipeItem of item.product.ingredients) {
              const ing = recipeItem.ingredient;
              const usage = recipeItem.quantityRequired * item.quantity;

              if (ingredientUsageMap.has(ing.id)) {
                ingredientUsageMap.get(ing.id)!.totalQty += usage;
              } else {
                ingredientUsageMap.set(ing.id, {
                  ingredient: ing,
                  totalQty: usage,
                });
              }
            }
          }

          // Apply deductions and log transactions
          for (const [ingId, { ingredient, totalQty }] of ingredientUsageMap.entries()) {
            const currentStock = ingredient.quantity;
            const newStock = Math.max(0, Math.round((currentStock - totalQty) * 100) / 100);

            await tx.ingredient.update({
              where: { id: ingId },
              data: { quantity: newStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                ingredientId: ingId,
                orderId: id,
                type: 'ORDER_CONSUMPTION',
                quantity: -totalQty,
                previousStock: currentStock,
                newStock,
                note: `Consumed for Order #${existingOrder.orderNumber}`,
              },
            });

            // Check if stock fell below threshold for warning alert
            if (newStock <= ingredient.minThreshold) {
              emitInventoryAlert(existingOrder.vendorId, {
                ingredientId: ingId,
                name: ingredient.name,
                currentStock: newStock,
                minThreshold: ingredient.minThreshold,
                unit: ingredient.unit,
                message: `Low Stock Alert: ${ingredient.name} has only ${newStock} ${ingredient.unit} remaining!`,
              });
            }
          }
        }

        // If cancelling an order that already had ingredients deducted, restore inventory
        if (newStatus === 'CANCELLED') {
          await tx.payment.updateMany({
            where: { orderId: id },
            data: { status: existingOrder.payment?.status === 'COMPLETED' ? 'REFUNDED' : 'FAILED' },
          });

          const previousDeductions = await tx.inventoryTransaction.findMany({
            where: {
              orderId: id,
              type: 'ORDER_CONSUMPTION',
            },
            include: { ingredient: true },
          });

          for (const deduction of previousDeductions) {
            const restoreQty = Math.abs(deduction.quantity);
            const currentStock = deduction.ingredient.quantity;
            const restoredStock = Math.round((currentStock + restoreQty) * 100) / 100;

            await tx.ingredient.update({
              where: { id: deduction.ingredientId },
              data: { quantity: restoredStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                ingredientId: deduction.ingredientId,
                orderId: id,
                type: 'RESTOCK',
                quantity: restoreQty,
                previousStock: currentStock,
                newStock: restoredStock,
                note: `Restocked due to vendor cancellation of Order #${existingOrder.orderNumber}`,
              },
            });
          }
        }

        // Notification messages according to new status
        let notifTitle = `Order #${existingOrder.orderNumber} Update`;
        let notifMessage = `Your order status changed to ${newStatus}.`;

        if (newStatus === 'ACCEPTED') {
          notifTitle = 'Order Accepted!';
          notifMessage = `${existingOrder.vendor.stallName} has accepted your order #${existingOrder.orderNumber}.`;
        } else if (newStatus === 'PREPARING') {
          notifTitle = 'Cooking in Progress!';
          notifMessage = `Your delicious food is being prepared at ${existingOrder.vendor.stallName}.`;
        } else if (newStatus === 'READY') {
          notifTitle = 'Order Ready for Collection! 🍽️';
          notifMessage = `Order #${existingOrder.orderNumber} is ready for pickup! Show OTP: ${existingOrder.pickupOtp} at the counter.`;
        } else if (newStatus === 'COLLECTED') {
          notifTitle = 'Order Collected!';
          notifMessage = `Enjoy your meal! Thank you for ordering with Smart Canteen.`;
        } else if (newStatus === 'CANCELLED') {
          notifTitle = 'Order Cancelled';
          notifMessage = `Order #${existingOrder.orderNumber} was cancelled. Reason: ${cancelledReason || 'Unavailable'}`;
        }

        await tx.notification.create({
          data: {
            userId: existingOrder.userId,
            title: notifTitle,
            message: notifMessage,
            type: 'ORDER_STATUS',
            link: `/orders/${existingOrder.id}`,
          },
        });

        return orderResult;
      });

      // Real-time broadcast to the customer
      emitOrderUpdateToCustomer(existingOrder.userId, updatedOrder);

      res.json({
        success: true,
        message: `Order status updated to ${newStatus}`,
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/orders/:id/verify-pickup (Vendor verifies customer's 4-digit OTP)
router.post(
  '/:id/verify-pickup',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const { otp } = z.object({ otp: z.string().min(4) }).parse(req.body);

      const order = await prisma.order.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && order.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (order.pickupOtp !== otp.trim()) {
        res.status(400).json({ success: false, message: 'Invalid Pickup OTP. Please check with customer.' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: 'COLLECTED',
          paymentStatus: 'COMPLETED',
        },
        include: {
          items: { include: { product: true } },
          vendor: true,
          user: { select: { id: true, name: true, email: true } },
          payment: true,
        },
      });

      await prisma.payment.updateMany({
        where: { orderId: id },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Order Completed & Collected!',
          message: `Order #${order.orderNumber} has been verified and picked up. Enjoy your meal!`,
          type: 'ORDER_STATUS',
          link: `/orders/${order.id}`,
        },
      });

      emitOrderUpdateToCustomer(order.userId, updated);

      res.json({
        success: true,
        message: 'Order verified and collected successfully!',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
