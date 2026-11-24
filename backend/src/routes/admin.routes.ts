import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth';

const router = Router();

// Require ADMIN role for all routes in this file
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', async (_req: AuthRequest, res: Response, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalVendors,
      totalOrders,
      todayOrders,
      allOrders,
      totalProducts,
      ingredients,
      categoriesCount,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.order.count(),
      prisma.order.findMany({
        where: {
          createdAt: { gte: todayStart },
          status: { not: 'CANCELLED' },
        },
        select: { finalAmount: true },
      }),
      prisma.order.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { finalAmount: true, status: true, createdAt: true },
      }),
      prisma.product.count(),
      prisma.ingredient.findMany({
        select: { id: true, name: true, quantity: true, minThreshold: true },
      }),
      prisma.category.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
        },
      }),
    ]);

    const totalRevenue = allOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    const lowStockCount = ingredients.filter((i) => i.quantity <= i.minThreshold).length;

    // Order status breakdown
    const orderStatusBreakdown: Record<string, number> = {
      PLACED: 0,
      ACCEPTED: 0,
      PREPARING: 0,
      READY: 0,
      COLLECTED: 0,
      CANCELLED: 0,
    };
    allOrders.forEach((o) => {
      if (orderStatusBreakdown[o.status] !== undefined) {
        orderStatusBreakdown[o.status]++;
      }
    });

    // Last 30 days revenue trends (grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendsMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendsMap[key] = 0;
    }

    allOrders.forEach((o) => {
      const key = o.createdAt.toISOString().split('T')[0];
      if (trendsMap[key] !== undefined) {
        trendsMap[key] += o.finalAmount;
      }
    });

    const revenueTrends = Object.entries(trendsMap).map(([date, revenue]) => ({
      date: date.substring(5), // MM-DD
      revenue: Math.round(revenue * 100) / 100,
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        totalOrders,
        totalProducts,
        totalCategories: categoriesCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayOrdersCount: todayOrders.length,
        lowStockCount,
        orderStatusBreakdown,
        revenueTrends,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users (List all users with filters & pagination)
router.get('/users', async (req: AuthRequest, res: Response, next) => {
  try {
    const { role, search, status, limit = '50', page = '1' } = req.query;

    const where: any = {};
    if (role && typeof role === 'string' && role !== 'ALL') {
      where.role = role;
    }

    if (status && status !== 'ALL') {
      where.isActive = status === 'active';
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          vendorProfile: true,
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        department: u.department,
        roomNumber: u.roomNumber,
        isActive: u.isActive,
        ordersCount: u._count.orders,
        vendorProfile: u.vendorProfile,
        createdAt: u.createdAt,
      })),
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

// PATCH /api/admin/users/:id/role (Change user role)
router.patch('/users/:id/role', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { role } = z.object({
      role: z.enum(['STUDENT', 'FACULTY', 'VENDOR', 'ADMIN']),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // If changing to VENDOR and has no vendor profile, create one
    if (role === 'VENDOR') {
      const existingVendor = await prisma.vendor.findUnique({ where: { userId: id } });
      if (!existingVendor) {
        await prisma.vendor.create({
          data: {
            userId: id,
            stallName: `${user.name}'s Canteen Stall`,
            location: 'Campus Food Court',
            isOpen: true,
          },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/status (Toggle active / inactive)
router.patch('/users/:id/status', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Prevent deactivating own admin account
    if (user.id === req.user!.id) {
      res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/vendors (Manage vendors)
router.get('/vendors', async (_req: AuthRequest, res: Response, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: {
          select: { products: true, orders: true, ingredients: true },
        },
      },
    });

    // Calculate revenue per vendor
    const vendorIds = vendors.map((v) => v.id);
    const vendorOrders = await prisma.order.findMany({
      where: {
        vendorId: { in: vendorIds },
        status: { not: 'CANCELLED' },
      },
      select: { vendorId: true, finalAmount: true },
    });

    const vendorRevenueMap: Record<string, number> = {};
    vendorOrders.forEach((o) => {
      vendorRevenueMap[o.vendorId] = (vendorRevenueMap[o.vendorId] || 0) + o.finalAmount;
    });

    res.json({
      success: true,
      data: vendors.map((v) => ({
        ...v,
        totalRevenue: Math.round((vendorRevenueMap[v.id] || 0) * 100) / 100,
        productsCount: v._count.products,
        ordersCount: v._count.orders,
        ingredientsCount: v._count.ingredients,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (_req: AuthRequest, res: Response, next) => {
  try {
    const [recentOrders, recentTransactions] = await Promise.all([
      prisma.order.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          vendor: { select: { stallName: true } },
        },
      }),
      prisma.inventoryTransaction.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          ingredient: {
            select: { name: true, unit: true, vendor: { select: { stallName: true } } },
          },
          order: { select: { orderNumber: true } },
        },
      }),
    ]);

    const logs: any[] = [];

    recentOrders.forEach((o) => {
      logs.push({
        id: `order-${o.id}`,
        timestamp: o.createdAt,
        type: 'ORDER',
        title: `Order #${o.orderNumber}`,
        description: `${o.user.name} placed an order of ₹${o.finalAmount} at ${o.vendor.stallName} (Status: ${o.status})`,
        status: o.status,
      });
    });

    recentTransactions.forEach((t) => {
      logs.push({
        id: `tx-${t.id}`,
        timestamp: t.createdAt,
        type: 'INVENTORY',
        title: `Inventory: ${t.type}`,
        description: `${t.ingredient.vendor.stallName}: ${t.ingredient.name} stock changed by ${t.quantity} ${t.ingredient.unit}. (${t.note || ''})`,
        status: t.type,
      });
    });

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ success: true, data: logs.slice(0, 30) });
  } catch (error) {
    next(error);
  }
});

export default router;
