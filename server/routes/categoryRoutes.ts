import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Get all categories
router.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const categories = db.categories.find(false);
    res.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Add category
router.post('/', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { name, description, image, isActive } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const newCat = db.categories.create({
      name: name.trim(),
      description,
      image,
      isActive: isActive !== false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: newCat,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update category
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const updated = db.categories.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Category updated successfully.',
      category: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete category
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const success = db.categories.delete(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
