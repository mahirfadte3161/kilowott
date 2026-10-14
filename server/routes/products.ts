import { Router } from 'express';
import { query, get, run } from '../database/db.ts';
import { Product, ProductCategory } from '../types/index.ts';

const router = Router();

// GET /api/products/categories - List all categories with product count
router.get('/categories', (req, res) => {
  try {
    const categories = query<ProductCategory>(`
      SELECT c.*,
             (SELECT COUNT(*) FROM products WHERE categories LIKE '%' || c.name || '%') as active_count
      FROM product_categories c
      ORDER BY c.count DESC, c.name ASC
    `);

    res.json({
      success: true,
      data: categories,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/inventory/metrics - Dedicated inventory audit & stock health
router.get('/inventory/metrics', (req, res) => {
  try {
    const threshRow = get<{ value: string }>("SELECT value FROM prm_settings WHERE key = 'low_stock_threshold'");
    const lowStockThreshold = threshRow?.value ? parseInt(threshRow.value, 10) : 5;

    const total = get<{ c: number }>('SELECT COUNT(*) as c FROM products')?.c || 0;
    const inStock = get<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE stock_status = 'instock'")?.c || 0;
    const outOfStock = get<{ c: number }>(`
      SELECT COUNT(*) as c FROM products 
      WHERE stock_status = 'outofstock' OR (manage_stock = 1 AND stock_quantity = 0)
    `)?.c || 0;
    const lowStock = get<{ c: number }>(`
      SELECT COUNT(*) as c FROM products 
      WHERE stock_status = 'instock' AND manage_stock = 1 AND stock_quantity > 0 AND stock_quantity <= ?
    `, [lowStockThreshold])?.c || 0;
    const missingSku = get<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE sku IS NULL OR trim(sku) = ''")?.c || 0;
    const unpriced = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE price <= 0 OR price IS NULL')?.c || 0;
    const stockManaged = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE manage_stock = 1')?.c || 0;
    const stockUnmanaged = total - stockManaged;
    const attentionNeeded = get<{ c: number }>(`
      SELECT COUNT(*) as c FROM products 
      WHERE (sku IS NULL OR trim(sku) = '') 
         OR price <= 0 
         OR stock_status = 'outofstock'
    `)?.c || 0;

    res.json({
      success: true,
      data: {
        total,
        inStock,
        outOfStock,
        lowStock,
        missingSku,
        unpriced,
        stockManaged,
        stockUnmanaged,
        attentionNeeded,
        lowStockThreshold,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/settings/prm - Get PRM configuration
router.get('/settings/prm', (req, res) => {
  try {
    const threshRow = get<{ value: string }>("SELECT value FROM prm_settings WHERE key = 'low_stock_threshold'");
    res.json({
      success: true,
      data: {
        lowStockThreshold: threshRow?.value ? parseInt(threshRow.value, 10) : 5,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/settings/prm - Update PRM configuration
router.post('/settings/prm', (req, res) => {
  try {
    const { lowStockThreshold } = req.body;
    if (lowStockThreshold !== undefined) {
      const val = Math.max(1, parseInt(String(lowStockThreshold), 10));
      run("INSERT OR REPLACE INTO prm_settings (key, value, updated_at) VALUES ('low_stock_threshold', ?, datetime('now'))", [val.toString()]);
    }
    res.json({ success: true, message: 'PRM settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products - List with comprehensive PRM search, filters, sorting & pagination
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '12', 10)));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim().toLowerCase();
    const category = (req.query.category as string || '').trim();
    const stockStatus = (req.query.stockStatus as string || '').trim();
    const productType = (req.query.productType as string || '').trim();
    const status = (req.query.status as string || '').trim();
    const featured = req.query.featured;
    const inventoryFilter = (req.query.inventoryFilter as string || '').trim(); // 'low_stock' | 'out_of_stock' | 'missing_sku' | 'unpriced' | 'unmanaged'

    const sortBy = (req.query.sortBy as string || 'name').trim();
    const sortDir = (req.query.sortDir as string || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Search by Name or SKU
    if (search) {
      conditions.push('(LOWER(p.name) LIKE ? OR LOWER(coalesce(p.sku, \'\')) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Category Filter
    if (category && category !== 'all') {
      conditions.push('p.categories LIKE ?');
      params.push(`%${category}%`);
    }

    // Stock Status Filter
    if (stockStatus && stockStatus !== 'all' && ['instock', 'outofstock', 'onbackorder'].includes(stockStatus)) {
      conditions.push('p.stock_status = ?');
      params.push(stockStatus);
    }

    // Product Type Filter
    if (productType && productType !== 'all') {
      conditions.push('p.product_type = ?');
      params.push(productType);
    }

    // Publish Status Filter
    if (status && status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }

    // Featured Filter
    if (featured !== undefined && featured !== '') {
      conditions.push('p.featured = ?');
      params.push(featured === 'true' || featured === '1' ? 1 : 0);
    }

    // Specific Inventory Health Filters
    if (inventoryFilter) {
      const threshRow = get<{ value: string }>("SELECT value FROM prm_settings WHERE key = 'low_stock_threshold'");
      const thresh = threshRow?.value ? parseInt(threshRow.value, 10) : 5;

      if (inventoryFilter === 'low_stock') {
        conditions.push('p.stock_status = \'instock\' AND p.manage_stock = 1 AND p.stock_quantity > 0 AND p.stock_quantity <= ?');
        params.push(thresh);
      } else if (inventoryFilter === 'out_of_stock') {
        conditions.push('(p.stock_status = \'outofstock\' OR (p.manage_stock = 1 AND p.stock_quantity = 0))');
      } else if (inventoryFilter === 'in_stock') {
        conditions.push('p.stock_status = \'instock\'');
      } else if (inventoryFilter === 'missing_sku') {
        conditions.push('(p.sku IS NULL OR trim(p.sku) = \'\')');
      } else if (inventoryFilter === 'unpriced') {
        conditions.push('(p.price <= 0 OR p.price IS NULL)');
      } else if (inventoryFilter === 'unmanaged') {
        conditions.push('p.manage_stock = 0');
      } else if (inventoryFilter === 'attention') {
        conditions.push('((p.sku IS NULL OR trim(p.sku) = \'\') OR p.price <= 0 OR p.stock_status = \'outofstock\')');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSortCols: Record<string, string> = {
      name: 'p.name',
      price: 'p.price',
      stock: 'COALESCE(p.stock_quantity, 0)',
      stock_quantity: 'COALESCE(p.stock_quantity, 0)',
      updated_at: 'p.updated_at',
      created_at: 'p.created_at',
      status: 'p.status',
    };
    const sortColumn = allowedSortCols[sortBy] || 'p.name';

    const countQuery = `SELECT COUNT(*) as c FROM products p ${whereClause}`;
    const totalCount = get<{ c: number }>(countQuery, params)?.c || 0;

    const dataQuery = `
      SELECT p.*
      FROM products p
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const rawProducts = query<any>(dataQuery, [...params, limit, offset]);

    // Parse JSON columns safely
    const products: Product[] = rawProducts.map(p => {
      let parsedCategories = [];
      try {
        parsedCategories = p.categories ? JSON.parse(p.categories) : [];
      } catch {
        parsedCategories = p.categories ? [p.categories] : [];
      }

      return {
        ...p,
        categories: parsedCategories.join(', '),
      };
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id - Full Product details with parsed specifications & gallery
router.get('/:id', (req, res) => {
  try {
    const raw = get<any>('SELECT * FROM products WHERE id = ? OR wc_product_id = ?', [req.params.id, req.params.id]);
    if (!raw) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Safely parse JSON metadata
    let images: any[] = [];
    let attributes: any[] = [];
    let variations: any[] = [];
    let dimensions: any = null;
    let tags: string[] = [];
    let categories: string[] = [];

    try { if (raw.images_json) images = JSON.parse(raw.images_json); } catch {}
    try { if (raw.attributes_json) attributes = JSON.parse(raw.attributes_json); } catch {}
    try { if (raw.variations_json) variations = JSON.parse(raw.variations_json); } catch {}
    try { if (raw.dimensions_json) dimensions = JSON.parse(raw.dimensions_json); } catch {}
    try { if (raw.tags_json) tags = JSON.parse(raw.tags_json); } catch {}
    try { if (raw.categories) categories = JSON.parse(raw.categories); } catch {
      if (raw.categories) categories = [raw.categories];
    }

    const product = {
      ...raw,
      images,
      attributes,
      variations,
      dimensions,
      tags,
      categoriesList: categories,
    };

    res.json({
      success: true,
      data: product,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
