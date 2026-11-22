import { Router, Response } from 'express';
import { resetDatabase } from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Reset database to pristine seed data
router.post('/reset', (_req: AuthRequest, res: Response) => {
  try {
    resetDatabase();
    res.json({
      success: true,
      message: 'Database successfully re-seeded with demo categories, products, coupons, and orders.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
