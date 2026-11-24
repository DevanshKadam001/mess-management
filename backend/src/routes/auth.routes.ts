import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middlewares/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['STUDENT', 'FACULTY', 'VENDOR', 'ADMIN']).default('STUDENT'),
  department: z.string().optional(),
  roomNumber: z.string().optional(),
  stallName: z.string().optional(), // For vendors
  stallLocation: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email is already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        role: data.role,
        department: data.department?.trim() || null,
        roomNumber: data.roomNumber?.trim() || null,
      },
    });

    // If role is VENDOR, create a corresponding Vendor profile
    let vendorId: string | undefined;
    if (data.role === 'VENDOR') {
      const vendor = await prisma.vendor.create({
        data: {
          userId: user.id,
          stallName: data.stallName?.trim() || `${user.name}'s Canteen Stall`,
          location: data.stallLocation?.trim() || 'Campus Food Court',
          isOpen: true,
        },
      });
      vendorId = vendor.id;
    }

    // Auto-create cart for STUDENT/FACULTY
    if (data.role === 'STUDENT' || data.role === 'FACULTY') {
      await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        vendorId,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
        roomNumber: user.roomNumber,
        vendorId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      include: { vendorProfile: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const vendorId = user.vendorProfile?.id;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        vendorId,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
        roomNumber: user.roomNumber,
        vendorId,
        vendorProfile: user.vendorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        vendorProfile: true,
        _count: {
          select: {
            orders: true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
        roomNumber: user.roomNumber,
        avatarUrl: user.avatarUrl,
        vendorProfile: user.vendorProfile,
        ordersCount: user._count.orders,
        unreadNotificationsCount: user._count.notifications,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      department: z.string().optional(),
      roomNumber: z.string().optional(),
      avatarUrl: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      include: { vendorProfile: true },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        department: updatedUser.department,
        roomNumber: updatedUser.roomNumber,
        avatarUrl: updatedUser.avatarUrl,
        vendorProfile: updatedUser.vendorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
