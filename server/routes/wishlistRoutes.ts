import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

const router = Router();

// Get user wishlist
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const wishlist = db.wishlists.findByUserId(req.user!._id);
    res.json({
      success: true,
      wishlist,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle product in wishlist
router.post('/toggle', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: 'ProductId is required.' });
      return;
    }

    const result = db.wishlists.toggle(req.user!._id, productId);
    res.json({
      success: true,
      inWishlist: result.inWishlist,
      message: result.inWishlist ? 'Added to Wishlist' : 'Removed from Wishlist',
      productIds: result.productIds,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove product from wishlist
router.delete('/:productId', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const result = db.wishlists.toggle(req.user!._id, req.params.productId);
    // If it was toggled back on, toggle once more to ensure it's removed
    if (result.inWishlist) {
      db.wishlists.toggle(req.user!._id, req.params.productId);
    }
    const wishlist = db.wishlists.findByUserId(req.user!._id);
    res.json({
      success: true,
      message: 'Item removed from wishlist.',
      wishlist,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
