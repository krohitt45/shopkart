import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

const router = Router();

// Place order
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart items are required to place an order.' });
      return;
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.pincode) {
      res.status(400).json({ success: false, message: 'Valid shipping address is required.' });
      return;
    }

    // Verify stock availability
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const prod = db.products.findById(item.productId);
      if (!prod) {
        res.status(404).json({ success: false, message: `Product ${item.name || item.productId} not found.` });
        return;
      }
      if (prod.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prod.name}". Only ${prod.stock} units remaining.`,
        });
        return;
      }

      const itemPrice = prod.price;
      subtotal += itemPrice * item.quantity;
      orderItems.push({
        productId: prod._id,
        name: prod.name,
        image: prod.images[0] || '',
        price: itemPrice,
        originalPrice: prod.originalPrice,
        quantity: item.quantity,
      });
    }

    // Calculate coupon discount
    let discount = 0;
    if (couponCode) {
      const coupon = db.coupons.findByCode(couponCode);
      if (coupon && coupon.isActive && subtotal >= coupon.minimumOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        db.coupons.incrementUsage(couponCode);
      }
    }

    const shippingCharge = subtotal > 500 ? 0 : 40;
    const totalAmount = Math.max(0, subtotal - discount + shippingCharge);

    const user = req.user!;
    const order = db.orders.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || shippingAddress.phone,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      subtotal,
      discount,
      couponCode,
      shippingCharge,
      totalAmount,
    });

    // Clear cart after successful checkout
    db.carts.clearCart(user._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// My orders
router.get('/my-orders', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const orders = db.orders.find({ userId: req.user!._id });
    res.json({
      success: true,
      orders,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get order details
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const order = db.orders.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Check ownership unless admin
    if (order.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized access to order details.' });
      return;
    }

    res.json({
      success: true,
      order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel order (eligible if Pending, Confirmed, or Processing)
router.patch('/:id/cancel', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const order = db.orders.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].includes(order.orderStatus)) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}.`,
      });
      return;
    }

    const { reason = 'Cancelled by customer' } = req.body;
    const updated = db.orders.updateStatus(order._id, 'Cancelled', reason);

    res.json({
      success: true,
      message: 'Order cancelled successfully and stock restored.',
      order: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Return request
router.patch('/:id/return', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const order = db.orders.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    if (order.orderStatus !== 'Delivered') {
      res.status(400).json({
        success: false,
        message: 'Return can only be initiated for delivered orders.',
      });
      return;
    }

    const { reason = 'Return requested by customer' } = req.body;
    const updated = db.orders.updateStatus(order._id, 'Return Requested', reason);

    res.json({
      success: true,
      message: 'Return request submitted. Our executive will inspect and arrange pickup.',
      order: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
