import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Get public coupons
router.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const coupons = db.coupons.find(true);
    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Validate coupon against order subtotal
router.post('/validate', (req: AuthRequest, res: Response): void => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Coupon code is required.' });
      return;
    }

    const coupon = db.coupons.findByCode(code);
    if (!coupon || !coupon.isActive) {
      res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
      return;
    }

    if (new Date(coupon.expiryDate).getTime() < Date.now()) {
      res.status(400).json({ success: false, message: 'This coupon has expired.' });
      return;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ success: false, message: 'Coupon usage limit exceeded.' });
      return;
    }

    const subtotal = Number(cartTotal) || 0;
    if (subtotal < coupon.minimumOrderAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minimumOrderAmount.toLocaleString()} required for this coupon.`,
      });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      success: true,
      valid: true,
      coupon,
      discountAmount: discount,
      message: `Coupon ${coupon.code} applied! You saved ₹${discount.toLocaleString()}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all coupons
router.get('/all', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const coupons = db.coupons.find(false);
    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Create coupon
router.post('/', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { code, discountType, discountValue, minimumOrderAmount, maxDiscount, expiryDate, usageLimit, description } = req.body;
    if (!code || !discountType || !discountValue) {
      res.status(400).json({ success: false, message: 'Code, discount type, and value are required.' });
      return;
    }

    const existing = db.coupons.findByCode(code);
    if (existing) {
      res.status(409).json({ success: false, message: 'Coupon code already exists.' });
      return;
    }

    const coupon = db.coupons.create({
      code,
      discountType,
      discountValue: Number(discountValue),
      minimumOrderAmount: Number(minimumOrderAmount || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate,
      usageLimit: Number(usageLimit || 1000),
      description,
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully.', coupon });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update coupon
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const updated = db.coupons.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Coupon not found.' });
      return;
    }
    res.json({ success: true, message: 'Coupon updated successfully.', coupon: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete coupon
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const success = db.coupons.delete(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Coupon not found.' });
      return;
    }
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
