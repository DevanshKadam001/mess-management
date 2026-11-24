import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth';

const router = Router();

const ingredientRecipeSchema = z.object({
  ingredientId: z.string(),
  quantityRequired: z.number().positive('Quantity required must be positive'),
});

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(5, 'Description is required'),
  price: z.number().positive('Price must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  vendorId: z.string().optional(),
  imageUrl: z.string().min(1, 'Product image is required'),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  preparationTime: z.number().int().min(1).default(15),
  calories: z.number().int().optional().nullable(),
  badge: z.string().optional().nullable(),
  ingredients: z.array(ingredientRecipeSchema).optional(),
});

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      categoryId,
      categoryName,
      isVeg,
      vendorId,
      availableOnly,
      sort,
    } = req.query;

    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId;
    } else if (categoryName && typeof categoryName === 'string' && categoryName !== 'All') {
      where.category = { name: categoryName };
    }

    if (isVeg !== undefined && isVeg !== 'all' && isVeg !== '') {
      where.isVeg = isVeg === 'true';
    }

    if (vendorId && typeof vendorId === 'string') {
      where.vendorId = vendorId;
    }

    if (availableOnly === 'true') {
      where.isAvailable = true;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    else if (sort === 'price-desc') orderBy = { price: 'desc' };
    else if (sort === 'prep-time') orderBy = { preparationTime: 'asc' };
    else if (sort === 'name') orderBy = { name: 'asc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            stallName: true,
            location: true,
            isOpen: true,
          },
        },
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// POST /api/products (Vendor or Admin)
router.post(
  '/',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const data = productSchema.parse(req.body);

      // Determine vendorId
      let vendorId = data.vendorId;
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (!vendor) {
          res.status(400).json({ success: false, message: 'Vendor profile not found for this user.' });
          return;
        }
        vendorId = vendor.id;
      } else if (!vendorId) {
        // Admin must provide vendorId or use first vendor
        const firstVendor = await prisma.vendor.findFirst();
        if (!firstVendor) {
          res.status(400).json({ success: false, message: 'No vendor stalls exist yet.' });
          return;
        }
        vendorId = firstVendor.id;
      }

      const { ingredients, ...productData } = data;

      const product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            ...productData,
            vendorId: vendorId!,
          },
        });

        if (ingredients && ingredients.length > 0) {
          await tx.productIngredient.createMany({
            data: ingredients.map((ing) => ({
              productId: newProduct.id,
              ingredientId: ing.ingredientId,
              quantityRequired: ing.quantityRequired,
            })),
          });
        }

        return tx.product.findUnique({
          where: { id: newProduct.id },
          include: {
            category: true,
            ingredients: { include: { ingredient: true } },
          },
        });
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/products/:id (Vendor or Admin)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const data = productSchema.partial().parse(req.body);

      const existing = await prisma.product.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      // If user is VENDOR, ensure they own this product
      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'You cannot edit another vendor’s product' });
        return;
      }

      const { ingredients, ...productData } = data;

      const updated = await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: productData,
        });

        // If ingredients list was provided, update recipe
        if (ingredients !== undefined) {
          await tx.productIngredient.deleteMany({
            where: { productId: id },
          });

          if (ingredients.length > 0) {
            await tx.productIngredient.createMany({
              data: ingredients.map((ing) => ({
                productId: id,
                ingredientId: ing.ingredientId,
                quantityRequired: ing.quantityRequired,
              })),
            });
          }
        }

        return tx.product.findUnique({
          where: { id },
          include: {
            category: true,
            ingredients: { include: { ingredient: true } },
          },
        });
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/products/:id/toggle-availability
router.patch(
  '/:id/toggle-availability',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const existing = await prisma.product.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: { isAvailable: !existing.isAvailable },
      });

      res.json({
        success: true,
        message: `Product is now ${updated.isAvailable ? 'Available' : 'Unavailable'}`,
        isAvailable: updated.isAvailable,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/products/:id
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const existing = await prisma.product.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await prisma.product.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
