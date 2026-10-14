import { Router } from 'express';
import { WooCommerceService } from '../services/woocommerce.ts';
import { query } from '../database/db.ts';

const router = Router();

// GET /api/woocommerce/status - Get sanitized connection settings & sync health
router.get('/status', (req, res) => {
  try {
    const status = WooCommerceService.getPublicStatus();
    const recentSyncJobs = query('SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT 5');

    res.json({
      success: true,
      data: {
        ...status,
        recentSyncJobs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/woocommerce/settings - Save credentials securely
router.post('/settings', (req, res) => {
  try {
    const { storeUrl, consumerKey, consumerSecret, webhookSecret } = req.body;
    WooCommerceService.updateCredentials({ storeUrl, consumerKey, consumerSecret, webhookSecret });

    const status = WooCommerceService.getPublicStatus();
    res.json({
      success: true,
      message: 'WooCommerce credentials updated securely.',
      data: status,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/woocommerce/test - Test live connection
router.post('/test', async (req, res) => {
  try {
    const { storeUrl, consumerKey, consumerSecret } = req.body;
    let overrideCreds;
    if (storeUrl && consumerKey && consumerSecret) {
      overrideCreds = { storeUrl, consumerKey, consumerSecret };
    }

    const testResult = await WooCommerceService.testConnection(overrideCreds);
    res.json({ success: testResult.success, data: testResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/woocommerce/sync - Trigger sync (full or incremental)
router.post('/sync', async (req, res) => {
  try {
    const { incremental } = req.body;
    const result = await WooCommerceService.syncAll({ incremental: Boolean(incremental) });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/woocommerce/webhook - WooCommerce incoming webhook endpoint
router.post('/webhook', (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-wc-webhook-signature'] as string | undefined;
    const topic = req.headers['x-wc-webhook-topic'] as string | undefined;

    // Verify HMAC-SHA256 signature if secret is configured
    const creds = WooCommerceService.getCredentials();
    if (creds.webhookSecret) {
      const isValid = WooCommerceService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid HMAC signature' });
      }
    }

    // Idempotent processing based on topic
    if (topic?.startsWith('order.')) {
      WooCommerceService.upsertOrder(req.body, 'sync');
    } else if (topic?.startsWith('customer.')) {
      WooCommerceService.upsertCustomer(req.body, 'sync');
    } else if (topic?.startsWith('product.')) {
      WooCommerceService.upsertProduct(req.body, 'sync');
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
