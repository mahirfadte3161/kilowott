import { Router } from 'express';
import { query, get } from '../database/db.ts';
import { WooCommerceService } from '../services/woocommerce.ts';

const router = Router();

export interface ProductQualityAudit {
  id: string;
  wc_product_id: number | null;
  name: string;
  sku: string | null;
  price: number;
  hasSku: boolean;
  hasPrice: boolean;
  hasDescription: boolean;
  hasImage: boolean;
  hasCategory: boolean;
  hasAttributes: boolean;
  hasStock: boolean;
  completenessScore: number; // 0 - 100
  missingFields: string[];
  status: string;
  product_type: string;
  updated_at: string;
}

/**
 * Calculates a strict completeness score (0-100) and missing field checklist for a product.
 */
export function calculateProductQuality(prod: any): ProductQualityAudit {
  const missingFields: string[] = [];
  let score = 0;

  // 1. Name (15 pts)
  const hasName = Boolean(prod.name && prod.name.trim() !== '' && prod.name.trim().toLowerCase() !== 'product');
  if (hasName) score += 15;
  else missingFields.push('Specific Product Name');

  // 2. SKU (15 pts)
  const hasSku = Boolean(prod.sku && prod.sku.trim() !== '');
  if (hasSku) score += 15;
  else missingFields.push('SKU Identifier');

  // 3. Price (15 pts)
  const hasPrice = Boolean(prod.price && prod.price > 0);
  if (hasPrice) score += 15;
  else missingFields.push('Price / Regular Price');

  // 4. Description (15 pts)
  const hasDescription = Boolean(
    (prod.description && prod.description.trim() !== '') ||
    (prod.short_description && prod.short_description.trim() !== '')
  );
  if (hasDescription) score += 15;
  else missingFields.push('Product Description');

  // 5. Image (15 pts)
  const hasImage = Boolean(prod.image_url && prod.image_url.trim() !== '');
  if (hasImage) score += 15;
  else missingFields.push('Product Image / Gallery');

  // 6. Category (15 pts) - Must not be null, empty, or solely "Uncategorized"
  const catStr = prod.categories || '';
  const isUncategorized = !catStr || catStr.toLowerCase().includes('uncategorized') && !catStr.includes(',');
  const hasCategory = !isUncategorized && catStr.trim() !== '';
  if (hasCategory) score += 15;
  else missingFields.push('Assigned Category (Not Uncategorized)');

  // 7. Stock status & management (10 pts)
  const hasStock = Boolean(prod.stock_status && ['instock', 'outofstock', 'onbackorder'].includes(prod.stock_status));
  if (hasStock) score += 10;
  else missingFields.push('Stock Status');

  // Check attributes
  let hasAttributes = false;
  try {
    if (prod.attributes_json) {
      const parsed = JSON.parse(prod.attributes_json);
      hasAttributes = Array.isArray(parsed) && parsed.length > 0;
    }
  } catch {}

  return {
    id: prod.id,
    wc_product_id: prod.wc_product_id,
    name: prod.name,
    sku: prod.sku,
    price: prod.price,
    hasSku,
    hasPrice,
    hasDescription,
    hasImage,
    hasCategory,
    hasAttributes,
    hasStock,
    completenessScore: score,
    missingFields,
    status: prod.status || 'publish',
    product_type: prod.product_type || 'simple',
    updated_at: prod.updated_at,
  };
}

// GET /api/pim/quality - Comprehensive Data Quality & Completeness Audit
router.get('/quality', (req, res) => {
  try {
    const allProducts = query<any>('SELECT * FROM products ORDER BY name ASC');
    const audits: ProductQualityAudit[] = allProducts.map(calculateProductQuality);

    const total = audits.length;
    const avgScore = total > 0 ? Math.round(audits.reduce((acc, a) => acc + a.completenessScore, 0) / total) : 0;

    // Quality Tiers
    const excellent = audits.filter(a => a.completenessScore >= 80).length;
    const good = audits.filter(a => a.completenessScore >= 60 && a.completenessScore < 80).length;
    const needsWork = audits.filter(a => a.completenessScore >= 40 && a.completenessScore < 60).length;
    const poor = audits.filter(a => a.completenessScore < 40).length;

    // Missing field breakdown
    const missingSku = audits.filter(a => !a.hasSku).length;
    const missingPrice = audits.filter(a => !a.hasPrice).length;
    const missingDescription = audits.filter(a => !a.hasDescription).length;
    const missingImage = audits.filter(a => !a.hasImage).length;
    const missingCategory = audits.filter(a => !a.hasCategory).length;
    const missingAttributes = audits.filter(a => !a.hasAttributes).length;
    const requiringReview = audits.filter(a => a.completenessScore < 70).length;

    // Filter query param (e.g. ?filter=missing_sku)
    const filter = (req.query.filter as string || '').toLowerCase();
    let filteredAudits = audits;
    if (filter === 'missing_sku') filteredAudits = audits.filter(a => !a.hasSku);
    else if (filter === 'missing_price') filteredAudits = audits.filter(a => !a.hasPrice);
    else if (filter === 'missing_description') filteredAudits = audits.filter(a => !a.hasDescription);
    else if (filter === 'missing_image') filteredAudits = audits.filter(a => !a.hasImage);
    else if (filter === 'missing_category') filteredAudits = audits.filter(a => !a.hasCategory);
    else if (filter === 'missing_attributes') filteredAudits = audits.filter(a => !a.hasAttributes);
    else if (filter === 'review') filteredAudits = audits.filter(a => a.completenessScore < 70);
    else if (filter === 'excellent') filteredAudits = audits.filter(a => a.completenessScore >= 80);

    // Sort by lowest completeness score first
    filteredAudits.sort((a, b) => a.completenessScore - b.completenessScore);

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: total,
          catalogCompletenessScore: avgScore,
          requiringReview,
          tiers: {
            excellent,
            good,
            needsWork,
            poor,
          },
          missingCounts: {
            missingSku,
            missingPrice,
            missingDescription,
            missingImage,
            missingCategory,
            missingAttributes,
          },
        },
        audits: filteredAudits.slice(0, 100),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pim/attributes - Attributes, Variations & Taxonomy Intelligence
router.get('/attributes', (req, res) => {
  try {
    const products = query<any>('SELECT id, name, sku, product_type, attributes_json, variations_json, tags_json, categories FROM products');

    const totalProducts = products.length;
    let productsWithAttributes = 0;
    let productsWithTags = 0;
    let variableProducts = 0;

    // Attribute key frequency map
    const attributeMap: Record<string, { count: number; sampleValues: Set<string> }> = {};
    const tagMap: Record<string, number> = {};

    for (const p of products) {
      if (p.product_type === 'variable') variableProducts++;

      // Attributes
      let hasAttr = false;
      if (p.attributes_json) {
        try {
          const attrs = JSON.parse(p.attributes_json);
          if (Array.isArray(attrs) && attrs.length > 0) {
            hasAttr = true;
            attrs.forEach((attr: any) => {
              const name = attr.name || 'Unnamed Attribute';
              if (!attributeMap[name]) {
                attributeMap[name] = { count: 0, sampleValues: new Set() };
              }
              attributeMap[name].count++;
              const options = Array.isArray(attr.options) ? attr.options : [attr.options];
              options.forEach((opt: any) => {
                if (opt && attributeMap[name].sampleValues.size < 8) {
                  attributeMap[name].sampleValues.add(String(opt));
                }
              });
            });
          }
        } catch {}
      }
      if (hasAttr) productsWithAttributes++;

      // Tags
      let hasTag = false;
      if (p.tags_json) {
        try {
          const tags = JSON.parse(p.tags_json);
          if (Array.isArray(tags) && tags.length > 0) {
            hasTag = true;
            tags.forEach((t: string) => {
              tagMap[t] = (tagMap[t] || 0) + 1;
            });
          }
        } catch {}
      }
      if (hasTag) productsWithTags++;
    }

    const attributeCoveragePct = totalProducts > 0 ? Math.round((productsWithAttributes / totalProducts) * 100) : 0;
    const tagCoveragePct = totalProducts > 0 ? Math.round((productsWithTags / totalProducts) * 100) : 0;

    // Transform attribute map for UI
    const attributesList = Object.entries(attributeMap).map(([name, data]) => ({
      name,
      productCount: data.count,
      coveragePct: totalProducts > 0 ? Math.round((data.count / totalProducts) * 100) : 0,
      values: Array.from(data.sampleValues),
    })).sort((a, b) => b.productCount - a.productCount);

    // Transform tags map
    const tagsList = Object.entries(tagMap).map(([tag, count]) => ({
      tag,
      count,
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        totalProducts,
        productsWithAttributes,
        attributeCoveragePct,
        productsWithTags,
        tagCoveragePct,
        variableProducts,
        simpleProducts: totalProducts - variableProducts,
        attributesList,
        tagsList,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
