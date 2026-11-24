import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middlewares/auth';

const router = Router();

// Helper to get or create cart
const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  stallName: true,
                  isOpen: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    stallName: true,
                    isOpen: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
};

// Calculate cart summary
const calculateCartSummary = (cart: any) => {
  let subtotal = 0;
  let totalItemsCount = 0;
  let hasUnavailableItems = false;

  const formattedItems = cart.items.map((item: any) => {
    const isAvailable = item.product.isAvailable && item.product.vendor.isOpen;
    if (!isAvailable) {
      hasUnavailableItems = true;
    }
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;
    totalItemsCount += item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: itemTotal,
      isAvailable,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
        isVeg: item.product.isVeg,
        isAvailable: item.product.isAvailable,
        vendorId: item.product.vendorId,
        vendorName: item.product.vendor.stallName,
        vendorIsOpen: item.product.vendor.isOpen,
      },
    };
  });

  const taxRate = 0.05; // 5% GST
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const finalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    id: cart.id,
    userId: cart.userId,
    items: formattedItems,
    itemsCount: totalItemsCount,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    taxRate: '5%',
    finalAmount,
    hasUnavailableItems,
  };
};

// GET /api/cart
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const cart = await getOrCreateCart(req.user!.id);
    const summary = calculateCartSummary(cart);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items (Add to cart)
router.post('/items', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const schema = z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1).default(1),
    });

    const { productId, quantity } = schema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (!product.isAvailable) {
      res.status(400).json({ success: false, message: 'This item is currently sold out / unavailable.' });
      return;
    }

    const cart = await getOrCreateCart(req.user!.id);

    // Check if cart already has items from a DIFFERENT vendor
    // (In campus canteen, items in a single order usually belong to one stall for preparation clarity)
    const existingOtherVendorItem = cart.items.find(
      (item) => item.product.vendorId !== product.vendorId
    );

    if (existingOtherVendorItem) {
      // Optional: Allow or warn. Let's warn if user wants to clear or restrict to 1 stall at a time
      // For best UX, if user agrees or we can allow same stall checkout:
      // Let's inform the user:
      // res.status(400).json({ success: false, message: 'Your cart contains items from another stall. Please checkout or clear cart first.' });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    const updatedCart = await getOrCreateCart(req.user!.id);
    res.json({
      success: true,
      message: `Added ${product.name} to cart`,
      data: calculateCartSummary(updatedCart),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/items/:id (Update quantity)
router.put('/items/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      quantity: z.number().int().min(0),
    });

    const { quantity } = schema.parse(req.body);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user!.id) {
      res.status(404).json({ success: false, message: 'Cart item not found' });
      return;
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id } });
    } else {
      await prisma.cartItem.update({
        where: { id },
        data: { quantity },
      });
    }

    const updatedCart = await getOrCreateCart(req.user!.id);
    res.json({
      success: true,
      data: calculateCartSummary(updatedCart),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/items/:id (Remove item)
router.delete('/items/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user!.id) {
      res.status(404).json({ success: false, message: 'Cart item not found' });
      return;
    }

    await prisma.cartItem.delete({ where: { id } });

    const updatedCart = await getOrCreateCart(req.user!.id);
    res.json({
      success: true,
      message: 'Item removed from cart',
      data: calculateCartSummary(updatedCart),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart (Clear entire cart)
router.delete('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    const updatedCart = await getOrCreateCart(req.user!.id);
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: calculateCartSummary(updatedCart),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
