import { Router } from 'express';
import { query, get } from '../database/db.ts';
import { WooCommerceService } from '../services/woocommerce.ts';

const router = Router();

router.get('/metrics', (req, res) => {
  try {
    // Read low stock threshold setting
    const threshRow = get<{ value: string }>("SELECT value FROM prm_settings WHERE key = 'low_stock_threshold'");
    const lowStockThreshold = threshRow?.value ? parseInt(threshRow.value, 10) : 5;

    // 1. Total Products
    const totalRow = get<{ c: number }>('SELECT COUNT(*) as c FROM products');
    const totalProducts = totalRow?.c || 0;

    // 2. Published Products
    const pubRow = get<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE status = 'publish'");
    const publishedProducts = pubRow?.c || 0;

    // 3. Draft / Pending Products
    const draftRow = get<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE status IN ('draft', 'pending', 'private')");
    const draftProducts = draftRow?.c || 0;

    // 4. Out of Stock Products
    const oosRow = get<{ c: number }>(`
      SELECT COUNT(*) as c FROM products 
      WHERE stock_status = 'outofstock' OR (manage_stock = 1 AND stock_quantity = 0)
    `);
    const outOfStockProducts = oosRow?.c || 0;

    // 5. Low Stock Products
    const lowRow = get<{ c: number }>(`
      SELECT COUNT(*) as c FROM products 
      WHERE stock_status = 'instock' AND manage_stock = 1 AND stock_quantity > 0 AND stock_quantity <= ?
    `, [lowStockThreshold]);
    const lowStockProducts = lowRow?.c || 0;

    // 6. Total Categories
    const catCountRow = get<{ c: number }>('SELECT COUNT(*) as c FROM product_categories');
    const totalCategories = catCountRow?.c || 0;

    // 7. Average Product Price (excluding unpriced items)
    const avgPriceRow = get<{ avg: number }>('SELECT COALESCE(AVG(price), 0) as avg FROM products WHERE price > 0');
    const averagePrice = Math.round((avgPriceRow?.avg || 0) * 100) / 100;

    // 8. Products Requiring Attention (missing SKU, unpriced $0, or out of stock)
    const attentionRow = get<{ c: number }>(`
      SELECT COUNT(*) as c FROM products 
      WHERE (sku IS NULL OR trim(sku) = '') 
         OR price <= 0 
         OR stock_status = 'outofstock'
    `);
    const attentionNeededCount = attentionRow?.c || 0;

    // Stock Status Distribution
    const inStockRow = get<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE stock_status = 'instock'");
    const onBackorderRow = get<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE stock_status = 'onbackorder'");
    const stockDistribution = {
      inStock: inStockRow?.c || 0,
      outOfStock: outOfStockProducts,
      onBackorder: onBackorderRow?.c || 0,
    };

    // Product Type Distribution
    const typeDistribution = query<{ type: string; count: number }>(`
      SELECT product_type as type, COUNT(*) as count 
      FROM products 
      GROUP BY product_type
      ORDER BY count DESC
    `);

    // Category Distribution (from product_categories table)
    const categoryDistribution = query<{ category: string; count: number }>(`
      SELECT name as category, count 
      FROM product_categories 
      ORDER BY count DESC, name ASC 
      LIMIT 10
    `);

    // Price Distribution Ranges
    const p0 = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE price = 0 OR price IS NULL')?.c || 0;
    const p1_25 = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE price > 0 AND price <= 25')?.c || 0;
    const p25_50 = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE price > 25 AND price <= 50')?.c || 0;
    const p50_100 = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE price > 50 AND price <= 100')?.c || 0;
    const p100_plus = get<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE price > 100')?.c || 0;

    const priceDistribution = [
      { range: 'Unpriced ($0)', count: p0 },
      { range: '$1 – $25', count: p1_25 },
      { range: '$25 – $50', count: p25_50 },
      { range: '$50 – $100', count: p50_100 },
      { range: '$100+', count: p100_plus },
    ];

    // Recently Updated Products (last 8)
    const recentlyUpdated = query<any>(`
      SELECT id, wc_product_id, name, sku, price, regular_price, sale_price,
             stock_quantity, stock_status, status, product_type, featured,
             categories, image_url, updated_at
      FROM products
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 8
    `);

    // Integration Status
    const integrationStatus = WooCommerceService.getPublicStatus();

    res.json({
      success: true,
      data: {
        metrics: {
          totalProducts,
          publishedProducts,
          draftProducts,
          outOfStockProducts,
          lowStockProducts,
          totalCategories,
          averagePrice,
          attentionNeededCount,
          lowStockThreshold,
        },
        stockDistribution,
        typeDistribution,
        categoryDistribution,
        priceDistribution,
        recentlyUpdated,
        integrationStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
