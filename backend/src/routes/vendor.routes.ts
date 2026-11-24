import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth';

const router = Router();

// GET /api/vendors (Public list of vendor stalls)
router.get('/', async (_req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    res.json({
      success: true,
      data: vendors.map((v) => ({
        ...v,
        productsCount: v._count.products,
        ordersCount: v._count.orders,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vendors/:id (Public vendor details with products)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        products: {
          include: { category: true },
        },
      },
    });

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
});

// GET /api/vendor/dashboard/stats (Vendor dashboard overview metrics)
router.get(
  '/dashboard/stats',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      let vendorId: string;
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (!vendor) {
          res.status(404).json({ success: false, message: 'Vendor profile not found' });
          return;
        }
        vendorId = vendor.id;
      } else {
        const qId = req.query.vendorId as string | undefined;
        if (!qId) {
          const firstVendor = await prisma.vendor.findFirst();
          if (!firstVendor) {
            res.json({
              success: true,
              data: {
                todayRevenue: 0,
                totalOrders: 0,
                pendingOrders: 0,
                availableItems: 0,
                lowStockCount: 0,
                weeklyRevenue: [],
                bestsellers: [],
              },
            });
            return;
          }
          vendorId = firstVendor.id;
        } else {
          vendorId = qId;
        }
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Parallel queries for fast performance
      const [
        todayOrders,
        allOrdersCount,
        pendingOrdersCount,
        availableItemsCount,
        totalItemsCount,
        ingredients,
        allCompletedOrders,
        allOrderItems,
      ] = await Promise.all([
        prisma.order.findMany({
          where: {
            vendorId,
            createdAt: { gte: todayStart },
            status: { not: 'CANCELLED' },
          },
          select: { finalAmount: true },
        }),
        prisma.order.count({
          where: { vendorId },
        }),
        prisma.order.count({
          where: {
            vendorId,
            status: { in: ['PLACED', 'ACCEPTED', 'PREPARING'] },
          },
        }),
        prisma.product.count({
          where: { vendorId, isAvailable: true },
        }),
        prisma.product.count({
          where: { vendorId },
        }),
        prisma.ingredient.findMany({
          where: { vendorId },
          select: { id: true, name: true, quantity: true, minThreshold: true, unit: true },
        }),
        prisma.order.findMany({
          where: {
            vendorId,
            status: { in: ['READY', 'COLLECTED', 'PLACED', 'ACCEPTED', 'PREPARING'] },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          select: { createdAt: true, finalAmount: true },
        }),
        prisma.orderItem.findMany({
          where: {
            order: {
              vendorId,
              status: { not: 'CANCELLED' },
            },
          },
          select: {
            productId: true,
            productName: true,
            quantity: true,
            subtotal: true,
          },
        }),
      ]);

      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0);

      // Low stock count
      const lowStockItems = ingredients.filter((i) => i.quantity <= i.minThreshold);

      // Calculate last 7 days revenue map
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyRevenueMap: Record<string, { day: string; date: string; revenue: number; orders: number }> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayLabel = dayNames[d.getDay()];
        weeklyRevenueMap[dateKey] = { day: dayLabel, date: dateKey, revenue: 0, orders: 0 };
      }

      allCompletedOrders.forEach((o) => {
        const dKey = o.createdAt.toISOString().split('T')[0];
        if (weeklyRevenueMap[dKey]) {
          weeklyRevenueMap[dKey].revenue += o.finalAmount;
          weeklyRevenueMap[dKey].orders += 1;
        }
      });

      const weeklyRevenue = Object.values(weeklyRevenueMap);

      // Bestsellers aggregation
      const productSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {};
      allOrderItems.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            id: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      });

      const bestsellers = Object.values(productSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          todayRevenue: Math.round(todayRevenue * 100) / 100,
          totalOrders: allOrdersCount,
          pendingOrders: pendingOrdersCount,
          availableItems: availableItemsCount,
          totalItems: totalItemsCount,
          lowStockCount: lowStockItems.length,
          lowStockAlerts: lowStockItems.slice(0, 5),
          weeklyRevenue,
          bestsellers,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendor/reports/sales (Sales analytics and CSV generator data)
router.get(
  '/reports/sales',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { vendorId: queryVendorId, startDate, endDate, format } = req.query;

      let vendorId = queryVendorId as string | undefined;
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (vendor) vendorId = vendor.id;
      }

      const where: any = {
        status: { not: 'CANCELLED' },
      };
      if (vendorId) where.vendorId = vendorId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { name: true, email: true, phone: true } },
          payment: true,
        },
      });

      const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
      const totalTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);

      if (format === 'csv') {
        // Return CSV string
        let csv = 'Order ID,Date,Customer,Items,Payment Method,Status,Tax (₹),Total (₹)\n';
        orders.forEach((o) => {
          const itemsStr = o.items.map((i) => `${i.productName} (x${i.quantity})`).join('; ');
          const dateStr = o.createdAt.toISOString();
          csv += `"${o.orderNumber}","${dateStr}","${o.user.name}","${itemsStr}","${o.paymentMethod}","${o.status}",${o.taxAmount},${o.finalAmount}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="canteen-sales-report.csv"');
        res.send(csv);
        return;
      }

      res.json({
        success: true,
        data: {
          totalOrders: orders.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          orders,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendor/reports/inventory (Inventory usage report)
router.get(
  '/reports/inventory',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { vendorId: queryVendorId, format } = req.query;

      let vendorId = queryVendorId as string | undefined;
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (vendor) vendorId = vendor.id;
      }

      const where: any = {};
      if (vendorId) where.vendorId = vendorId;

      const ingredients = await prisma.ingredient.findMany({
        where,
        include: {
          transactions: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { productUses: true },
          },
        },
      });

      if (format === 'csv') {
        let csv = 'Ingredient,Available Stock,Unit,Min Threshold,Cost Per Unit (₹),Status,Products Count\n';
        ingredients.forEach((ing) => {
          const status = ing.quantity <= 0 ? 'Out of Stock' : ing.quantity <= ing.minThreshold ? 'Low Stock' : 'Adequate';
          csv += `"${ing.name}",${ing.quantity},"${ing.unit}",${ing.minThreshold},${ing.costPerUnit},"${status}",${ing._count.productUses}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="canteen-inventory-report.csv"');
        res.send(csv);
        return;
      }

      res.json({
        success: true,
        data: ingredients.map((ing) => ({
          ...ing,
          productsCount: ing._count.productUses,
          status: ing.quantity <= 0 ? 'OUT_OF_STOCK' : ing.quantity <= ing.minThreshold ? 'LOW_STOCK' : 'IN_STOCK',
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/vendor/profile (Update stall details & open/close toggle)
router.put(
  '/profile',
  authenticateToken,
  requireRole(['VENDOR']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const schema = z.object({
        stallName: z.string().min(2).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        isOpen: z.boolean().optional(),
        phone: z.string().optional(),
        bannerImage: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.id },
      });

      if (!vendor) {
        res.status(404).json({ success: false, message: 'Vendor profile not found' });
        return;
      }

      const updated = await prisma.vendor.update({
        where: { id: vendor.id },
        data,
      });

      res.json({
        success: true,
        message: 'Vendor profile updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
