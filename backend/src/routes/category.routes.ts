import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

// GET /api/categories
router.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.json({
      success: true,
      data: categories.map((c) => ({
        ...c,
        productsCount: c._count.products,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories (Admin & Vendor)
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'VENDOR']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const data = categorySchema.parse(req.body);

      const existing = await prisma.category.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        res.status(400).json({ success: false, message: 'Category already exists' });
        return;
      }

      const category = await prisma.category.create({
        data,
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/categories/:id (Admin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const data = categorySchema.partial().parse(req.body);

      const updated = await prisma.category.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/categories/:id (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const productsUsingCategory = await prisma.product.count({
        where: { categoryId: id },
      });

      if (productsUsingCategory > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete category. ${productsUsingCategory} product(s) are using it.`,
        });
        return;
      }

      await prisma.category.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
