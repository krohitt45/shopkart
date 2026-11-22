import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Get products with full filtering, sorting, and pagination
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page = '1',
      limit = '12',
      featured,
      bestSeller,
      deals,
    } = req.query as { [key: string]: string | undefined };

    let items = db.products.find({
      category,
      brand,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      featured: featured === 'true',
      bestSeller: bestSeller === 'true',
      deals: deals === 'true',
      activeOnly: true,
    });

    // Sorting
    switch (sort) {
      case 'price-low-high':
      case 'price_asc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
      case 'price_desc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        items.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'newest':
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popularity':
      default:
        items.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
        break;
    }

    const total = items.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    // Extract dynamic facet brands for easy filtering
    const allBrands = Array.from(new Set(db.products.find().map((p) => p.brand))).filter(Boolean);

    res.json({
      success: true,
      products: paginatedItems,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      brands: allBrands,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single product details
router.get('/:id', (req: AuthRequest, res: Response): void => {
  try {
    const product = db.products.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const reviews = db.reviews.findByProductId(product._id);
    const relatedProducts = db.products
      .find({ category: product.category, activeOnly: true })
      .filter((p) => p._id !== product._id)
      .slice(0, 4);

    res.json({
      success: true,
      product,
      reviews,
      relatedProducts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Create product
router.post('/', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { name, price, originalPrice, brand, category, stock, description, images, specifications } = req.body;
    if (!name || !price || !category) {
      res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
      return;
    }

    const newProd = db.products.create({
      ...req.body,
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      stock: Number(stock || 10),
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      ],
      specifications: Array.isArray(specifications) ? specifications : [],
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: newProd,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update product
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const updated = db.products.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete product
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const success = db.products.delete(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Bulk Import (JSON array or parsed CSV records)
router.post('/bulk-import', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ success: false, message: 'Array of products is required for bulk import.' });
      return;
    }

    const createdList = [];
    for (const item of products) {
      if (item.name && item.price) {
        const prod = db.products.create({
          name: item.name,
          brand: item.brand || 'Generic',
          category: item.category || 'Electronics',
          price: Number(item.price),
          originalPrice: Number(item.originalPrice || item.price),
          stock: Number(item.stock || 20),
          description: item.description || item.name,
          images: item.image ? [item.image] : undefined,
        });
        createdList.push(prod);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${createdList.length} products.`,
      count: createdList.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
