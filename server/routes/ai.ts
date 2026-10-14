import { Router } from 'express';
import { get } from '../database/db.ts';
import {
  generateProductDescription,
  isGeminiConfigured,
  DescriptionTone,
} from '../services/gemini.ts';

const router = Router();

// GET /api/ai/status - Check if Gemini is configured
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      configured: isGeminiConfigured(),
      model: 'gemini-2.5-flash',
    },
  });
});

// POST /api/ai/generate-description - Generate AI product description
router.post('/generate-description', async (req, res) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI is not configured. Add GEMINI_API_KEY to your .env file.',
      });
    }

    const { productId, tone = 'professional', name, category, price, sku, attributes, productType } = req.body;

    let productData: any = { name, category, price, sku, attributes, productType };

    // If productId provided, fetch full data from DB for richer context
    if (productId) {
      const product = get<any>('SELECT * FROM products WHERE id = ?', [productId]);
      if (product) {
        let parsedAttributes: Array<{ name: string; values: string[] }> = [];
        if (product.attributes_json) {
          try {
            const raw = JSON.parse(product.attributes_json);
            parsedAttributes = (Array.isArray(raw) ? raw : []).map((a: any) => ({
              name: a.name || 'Attribute',
              values: Array.isArray(a.options) ? a.options : [a.options].filter(Boolean),
            }));
          } catch {}
        }

        productData = {
          name: product.name,
          category: product.categories || 'Uncategorized',
          price: product.price,
          sku: product.sku,
          productType: product.product_type || 'simple',
          attributes: parsedAttributes,
        };
      }
    }

    if (!productData.name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required to generate a description.',
      });
    }

    const validTones: DescriptionTone[] = ['professional', 'marketing', 'seo', 'casual'];
    const selectedTone: DescriptionTone = validTones.includes(tone) ? tone : 'professional';

    const result = await generateProductDescription({
      ...productData,
      tone: selectedTone,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'AI generation failed',
      });
    }

    res.json({
      success: true,
      data: {
        shortDescription: result.shortDescription,
        longDescription: result.longDescription,
        seoTitle: result.seoTitle,
        seoKeywords: result.seoKeywords,
        tone: selectedTone,
        productName: productData.name,
      },
    });
  } catch (err: any) {
    console.error('[AI Route] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
