import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth';
import { emitInventoryAlert } from '../socket';

const router = Router();

const ingredientSchema = z.object({
  name: z.string().min(2, 'Ingredient name is required'),
  quantity: z.number().min(0, 'Initial quantity must be 0 or greater'),
  unit: z.string().min(1, 'Unit is required (kg, g, liter, ml, pcs)'),
  minThreshold: z.number().min(0, 'Minimum threshold must be 0 or greater'),
  costPerUnit: z.number().min(0, 'Cost per unit must be 0 or greater'),
});

// GET /api/inventory (List ingredients for vendor / admin)
router.get(
  '/',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { vendorId: queryVendorId, lowStockOnly } = req.query;

      let vendorId = queryVendorId as string | undefined;
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (!vendor) {
          res.status(404).json({ success: false, message: 'Vendor profile not found' });
          return;
        }
        vendorId = vendor.id;
      }

      const where: any = {};
      if (vendorId) {
        where.vendorId = vendorId;
      }

      const ingredients = await prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          vendor: { select: { id: true, stallName: true } },
          productUses: {
            include: {
              product: { select: { id: true, name: true, price: true } },
            },
          },
        },
      });

      const formatted = ingredients.map((ing) => {
        const isOutOfStock = ing.quantity <= 0;
        const isLowStock = ing.quantity <= ing.minThreshold && !isOutOfStock;
        const status = isOutOfStock ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'IN_STOCK';

        return {
          ...ing,
          isLowStock,
          isOutOfStock,
          status,
          usedInProductsCount: ing.productUses.length,
          products: ing.productUses.map((pu) => ({
            productId: pu.productId,
            productName: pu.product.name,
            quantityRequired: pu.quantityRequired,
          })),
        };
      });

      const result = lowStockOnly === 'true'
        ? formatted.filter((item) => item.isLowStock || item.isOutOfStock)
        : formatted;

      res.json({
        success: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/inventory (Add new ingredient)
router.post(
  '/',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const data = ingredientSchema.parse(req.body);

      let vendorId: string;
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (!vendor) {
          res.status(404).json({ success: false, message: 'Vendor not found' });
          return;
        }
        vendorId = vendor.id;
      } else {
        const vendorIdBody = req.body.vendorId;
        if (!vendorIdBody) {
          const firstVendor = await prisma.vendor.findFirst();
          if (!firstVendor) {
            res.status(400).json({ success: false, message: 'No vendor stalls exist yet.' });
            return;
          }
          vendorId = firstVendor.id;
        } else {
          vendorId = vendorIdBody;
        }
      }

      const ingredient = await prisma.$transaction(async (tx) => {
        const newIng = await tx.ingredient.create({
          data: {
            ...data,
            vendorId,
            lastRestocked: data.quantity > 0 ? new Date() : null,
          },
        });

        if (data.quantity > 0) {
          await tx.inventoryTransaction.create({
            data: {
              ingredientId: newIng.id,
              type: 'RESTOCK',
              quantity: data.quantity,
              previousStock: 0,
              newStock: data.quantity,
              note: 'Initial stock entry',
            },
          });
        }

        return newIng;
      });

      res.status(201).json({
        success: true,
        message: 'Ingredient added to inventory',
        data: ingredient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/inventory/:id (Update ingredient metadata)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const updateSchema = ingredientSchema.partial();
      const data = updateSchema.parse(req.body);

      const existing = await prisma.ingredient.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Ingredient not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updated = await prisma.ingredient.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        message: 'Ingredient updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/inventory/:id/restock (Restock stock quantity)
router.post(
  '/:id/restock',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const restockSchema = z.object({
        amount: z.number().positive('Restock amount must be greater than 0'),
        costPerUnit: z.number().min(0).optional(),
        note: z.string().optional(),
      });

      const { amount, costPerUnit, note } = restockSchema.parse(req.body);

      const existing = await prisma.ingredient.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Ingredient not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const previousStock = existing.quantity;
      const newStock = Math.round((previousStock + amount) * 100) / 100;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.ingredient.update({
          where: { id },
          data: {
            quantity: newStock,
            lastRestocked: new Date(),
            ...(costPerUnit !== undefined ? { costPerUnit } : {}),
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            ingredientId: id,
            type: 'RESTOCK',
            quantity: amount,
            previousStock,
            newStock,
            note: note || `Restocked +${amount} ${existing.unit}`,
          },
        });

        return updated;
      });

      res.json({
        success: true,
        message: `Successfully restocked ${existing.name} (+${amount} ${existing.unit})`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/inventory/:id/adjust (Manual stock adjustment)
router.post(
  '/:id/adjust',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const adjustSchema = z.object({
        newQuantity: z.number().min(0, 'Quantity cannot be negative'),
        reason: z.string().min(2, 'Reason for adjustment is required'),
      });

      const { newQuantity, reason } = adjustSchema.parse(req.body);

      const existing = await prisma.ingredient.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Ingredient not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const diff = Math.round((newQuantity - existing.quantity) * 100) / 100;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.ingredient.update({
          where: { id },
          data: { quantity: newQuantity },
        });

        await tx.inventoryTransaction.create({
          data: {
            ingredientId: id,
            type: diff < 0 ? 'WASTAGE' : 'MANUAL_ADJUSTMENT',
            quantity: diff,
            previousStock: existing.quantity,
            newStock: newQuantity,
            note: reason,
          },
        });

        if (newQuantity <= existing.minThreshold) {
          emitInventoryAlert(existing.vendorId, {
            ingredientId: id,
            name: existing.name,
            currentStock: newQuantity,
            minThreshold: existing.minThreshold,
            unit: existing.unit,
            message: `Low Stock: ${existing.name} is now ${newQuantity} ${existing.unit}.`,
          });
        }

        return updated;
      });

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inventory/transactions (Audit log of inventory transactions)
router.get(
  '/transactions',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { ingredientId, limit = '100' } = req.query;

      const where: any = {};
      if (ingredientId && typeof ingredientId === 'string') {
        where.ingredientId = ingredientId;
      }

      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.id },
        });
        if (vendor) {
          where.ingredient = { vendorId: vendor.id };
        }
      }

      const transactions = await prisma.inventoryTransaction.findMany({
        where,
        take: parseInt(limit as string, 10),
        orderBy: { createdAt: 'desc' },
        include: {
          ingredient: { select: { id: true, name: true, unit: true } },
          order: { select: { id: true, orderNumber: true } },
        },
      });

      res.json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/inventory/:id
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['VENDOR', 'ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const existing = await prisma.ingredient.findUnique({
        where: { id },
        include: { vendor: true, productUses: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Ingredient not found' });
        return;
      }

      if (req.user!.role === 'VENDOR' && existing.vendor.userId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (existing.productUses.length > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete ingredient. It is used in ${existing.productUses.length} product recipe(s). Remove it from products first.`,
        });
        return;
      }

      await prisma.ingredient.delete({ where: { id } });

      res.json({ success: true, message: 'Ingredient removed from inventory' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
