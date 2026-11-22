import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Get reviews for a product
router.get('/:productId', (req: AuthRequest, res: Response) => {
  try {
    const reviews = db.reviews.findByProductId(req.params.productId);
    res.json({ success: true, reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add review
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !comment) {
      res.status(400).json({ success: false, message: 'ProductId, rating, and review comment are required.' });
      return;
    }

    const product = db.products.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const review = db.reviews.create({
      productId,
      userId: req.user!._id,
      userName: req.user!.name,
      rating: Number(rating),
      title: title || '',
      comment: comment.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully. Thank you for your feedback!',
      review,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all reviews
router.get('/', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const reviews = db.reviews.find();
    res.json({ success: true, reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Approve / Reject review
router.patch('/:id/approve', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { approved = true } = req.body;
    const ok = db.reviews.approve(req.params.id, Boolean(approved));
    if (!ok) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    res.json({ success: true, message: `Review ${approved ? 'approved' : 'rejected'}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete review
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const ok = db.reviews.delete(req.params.id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
