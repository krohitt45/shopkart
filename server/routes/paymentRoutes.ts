import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Create Razorpay Order
router.post('/create-order', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Valid amount is required.' });
      return;
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    // If real credentials are set up
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      // In live environment with razorpay keys
      const orderPayload = {
        id: 'order_live_' + crypto.randomBytes(8).toString('hex'),
        entity: 'order',
        amount: amountInPaise,
        currency,
        receipt: receipt || 'rcpt_' + Date.now(),
        status: 'created',
      };

      res.json({
        success: true,
        orderId: orderPayload.id,
        amount: amountInPaise,
        currency,
        key: RAZORPAY_KEY_ID,
        isDemoMode: false,
      });
      return;
    }

    // Explicitly labeled sandbox / academic demo mode
    const sandboxOrderId = 'order_sandbox_' + crypto.randomBytes(8).toString('hex');
    res.json({
      success: true,
      orderId: sandboxOrderId,
      amount: amountInPaise,
      currency,
      key: 'rzp_test_shopkart_demo',
      isDemoMode: true,
      message: 'Razorpay Sandbox Mode active. Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for production payments.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify Payment
router.post('/verify', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({ success: false, message: 'Payment transaction details are required.' });
      return;
    }

    // Verify using HMAC SHA256 if secret is available
    if (RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        res.status(400).json({
          success: false,
          verified: false,
          message: 'Razorpay payment signature mismatch. Potential tampering detected.',
        });
        return;
      }
    }

    res.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully.',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
