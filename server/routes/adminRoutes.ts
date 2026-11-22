import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Apply admin guard to all admin routes
router.use(requireAdmin);

// Analytics Dashboard
router.get('/dashboard', (_req: AuthRequest, res: Response) => {
  try {
    const analytics = db.getAnalytics();
    res.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Orders Management
router.get('/orders', (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query as { status?: string; search?: string };
    let orders = db.orders.find({ orderStatus: status });

    if (search) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Order Status
router.patch('/orders/:id/status', (req: AuthRequest, res: Response): void => {
  try {
    const { status, note } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required.' });
      return;
    }

    const updated = db.orders.updateStatus(req.params.id, status, note);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customers Management
router.get('/users', (_req: AuthRequest, res: Response) => {
  try {
    const users = db.users.find().map((u) => {
      const { password, ...safeUser } = u;
      const orderCount = db.orders.find({ userId: u._id }).length;
      return {
        ...safeUser,
        orderCount,
      };
    });

    res.json({
      success: true,
      users,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Block/Unblock Customer
router.patch('/users/:id/block', (req: AuthRequest, res: Response): void => {
  try {
    const { isBlocked } = req.body;
    const user = db.users.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ success: false, message: 'Administrator accounts cannot be blocked.' });
      return;
    }

    const updated = db.users.update(user._id, { isBlocked: Boolean(isBlocked) });
    const { password, ...safeUser } = updated!;

    res.json({
      success: true,
      message: `Customer ${user.name} has been ${isBlocked ? 'blocked' : 'unblocked'}.`,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Inventory Management
router.get('/inventory', (_req: AuthRequest, res: Response) => {
  try {
    const products = db.products.find({ activeOnly: false });
    const logs = db.inventoryLogs.find();

    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 15);
    const outOfStock = products.filter((p) => p.stock === 0);

    res.json({
      success: true,
      products,
      lowStock,
      outOfStock,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Adjust Inventory Stock
router.patch('/inventory/:productId', (req: AuthRequest, res: Response): void => {
  try {
    const { adjustment, reason } = req.body;
    if (adjustment === undefined || isNaN(Number(adjustment))) {
      res.status(400).json({ success: false, message: 'Valid stock adjustment quantity is required.' });
      return;
    }

    const success = db.products.adjustStock(
      req.params.productId,
      Number(adjustment),
      reason || 'Manual inventory adjustment',
      req.user!.name
    );

    if (!success) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const updatedProduct = db.products.findById(req.params.productId);
    res.json({
      success: true,
      message: 'Stock updated successfully.',
      product: updatedProduct,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reports & CSV Export Data
router.get('/reports', (req: AuthRequest, res: Response) => {
  try {
    const { range = 'monthly' } = req.query;
    const orders = db.orders.find();
    const products = db.products.find({ activeOnly: false });
    const users = db.users.find();

    // Generate CSV data string for orders
    const orderHeaders = 'Order ID,Customer,Email,Total Amount,Payment Method,Payment Status,Order Status,Date\n';
    const orderRows = orders
      .map(
        (o) =>
          `"${o.orderNumber}","${o.userName}","${o.userEmail}","₹${o.totalAmount}","${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}","${new Date(o.createdAt).toLocaleDateString()}"`
      )
      .join('\n');
    const ordersCsv = orderHeaders + orderRows;

    // Generate CSV for products
    const productHeaders = 'SKU,Product Name,Brand,Category,Price,Stock,Rating\n';
    const productRows = products
      .map(
        (p) =>
          `"${p.sku}","${p.name.replace(/"/g, '""')}","${p.brand}","${p.category}","₹${p.price}","${p.stock}","${p.averageRating}"`
      )
      .join('\n');
    const productsCsv = productHeaders + productRows;

    res.json({
      success: true,
      reports: {
        range,
        totalSales: orders
          .filter((o) => o.orderStatus !== 'Cancelled')
          .reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: orders.length,
        totalCustomers: users.filter((u) => u.role === 'customer').length,
        ordersCsv,
        productsCsv,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
