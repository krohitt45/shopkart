import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

const router = Router();

// Get cart
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const cart = db.carts.findByUserId(req.user!._id);
    res.json({
      success: true,
      cart,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add item to cart
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: 'ProductId is required.' });
      return;
    }

    const product = db.products.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`,
      });
      return;
    }

    const cart = db.carts.addItem(req.user!._id, productId, Number(quantity));
    res.json({
      success: true,
      message: 'Item added to cart.',
      cart,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update item quantity
router.put('/:productId', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    const product = db.products.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (Number(quantity) > product.stock) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`,
      });
      return;
    }

    const cart = db.carts.updateItem(req.user!._id, productId, Number(quantity));
    res.json({
      success: true,
      message: 'Cart updated.',
      cart,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove item from cart
router.delete('/:productId', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const cart = db.carts.removeItem(req.user!._id, req.params.productId);
    res.json({
      success: true,
      message: 'Item removed from cart.',
      cart,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Clear entire cart
router.delete('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    db.carts.clearCart(req.user!._id);
    res.json({
      success: true,
      message: 'Cart cleared successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
