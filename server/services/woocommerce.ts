import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();
import { db, run, query, get } from '../database/db.ts';
import type { RecordOrigin, WooCommerceCredentials } from '../types/index.ts';

export class WooCommerceService {
  /**
   * Retrieves active WooCommerce credentials from environment variables or encrypted settings.
   * Priority: .env variables take precedence over database overrides.
   * Credentials are never returned to the frontend.
   */
  public static getCredentials(): WooCommerceCredentials {
    const storeUrl = (process.env.WC_STORE_URL || '').trim();
    const consumerKey = (process.env.WC_CONSUMER_KEY || '').trim();
    const consumerSecret = (process.env.WC_CONSUMER_SECRET || '').trim();
    const webhookSecret = (process.env.WC_WEBHOOK_SECRET || '').trim();

    // Fallback to database settings only if not defined in .env
    const urlRow = !storeUrl ? get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['wc_store_url']) : null;
    const keyRow = !consumerKey ? get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['wc_consumer_key']) : null;
    const secRow = !consumerSecret ? get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['wc_consumer_secret']) : null;
    const whRow = !webhookSecret ? get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['wc_webhook_secret']) : null;

    return {
      storeUrl: storeUrl || (urlRow?.value || '').trim(),
      consumerKey: consumerKey || (keyRow?.value || '').trim(),
      consumerSecret: consumerSecret || (secRow?.value || '').trim(),
      webhookSecret: webhookSecret || (whRow?.value || '').trim(),
    };
  }

  /**
   * Validates Store URL security:
   * Requires HTTPS for remote stores. Permits HTTP only for localhost/127.0.0.1.
   */
  public static validateStoreUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
    if (!url) {
      return { valid: false, error: 'Store URL is required' };
    }

    try {
      const parsed = new URL(url);
      const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname) || parsed.hostname.endsWith('.local');

      if (parsed.protocol === 'http:' && !isLocal) {
        return {
          valid: false,
          error: 'Remote WooCommerce stores must use HTTPS. Insecure HTTP is only permitted for local development (localhost / 127.0.0.1).',
        };
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'Store URL must use http or https protocol' };
      }

      // Strip trailing slash
      const normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
      return { valid: true, normalized };
    } catch {
      return { valid: false, error: 'Invalid Store URL format' };
    }
  }

  /**
   * Returns sanitized integration status for client UI.
   * Consumer key and secret are strictly masked.
   */
  public static getPublicStatus() {
    const creds = this.getCredentials();
    const lastSyncAtRow = get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['last_sync_at']);
    const lastSyncStatusRow = get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['last_sync_status']);
    const lastSyncErrorRow = get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['last_sync_error']);

    const isConfigured = Boolean(creds.storeUrl && creds.consumerKey && creds.consumerSecret);
    const maskedKey = creds.consumerKey 
      ? `${creds.consumerKey.slice(0, 5)}...${creds.consumerKey.slice(-4)}`
      : '';

    return {
      isConfigured,
      storeUrl: creds.storeUrl || '',
      consumerKeyMasked: maskedKey,
      hasConsumerSecret: Boolean(creds.consumerSecret),
      hasWebhookSecret: Boolean(creds.webhookSecret),
      lastSyncAt: lastSyncAtRow?.value || null,
      lastSyncStatus: lastSyncStatusRow?.value || 'never_synced',
      lastSyncError: lastSyncErrorRow?.value || null,
    };
  }

  /**
   * Updates integration settings securely.
   */
  public static updateCredentials(newSettings: {
    storeUrl?: string;
    consumerKey?: string;
    consumerSecret?: string;
    webhookSecret?: string;
  }) {
    const now = new Date().toISOString();

    if (newSettings.storeUrl !== undefined) {
      const validation = this.validateStoreUrl(newSettings.storeUrl);
      if (!validation.valid && newSettings.storeUrl.trim() !== '') {
        throw new Error(validation.error);
      }
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'wc_store_url',
        validation.normalized || newSettings.storeUrl.trim(),
        now,
      ]);
    }

    if (newSettings.consumerKey !== undefined && newSettings.consumerKey.trim() !== '') {
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'wc_consumer_key',
        newSettings.consumerKey.trim(),
        now,
      ]);
    }

    if (newSettings.consumerSecret !== undefined && newSettings.consumerSecret.trim() !== '') {
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'wc_consumer_secret',
        newSettings.consumerSecret.trim(),
        now,
      ]);
    }

    if (newSettings.webhookSecret !== undefined) {
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'wc_webhook_secret',
        newSettings.webhookSecret.trim(),
        now,
      ]);
    }
  }

  /**
   * Executes an authenticated request to WooCommerce REST API.
   * Handles timeouts, basic auth, and sanitized error messages.
   */
  private static async makeRequest<T = any>(
    endpoint: string,
    params: Record<string, string | number> = {},
    overrideCreds?: WooCommerceCredentials
  ): Promise<T> {
    const creds = overrideCreds || this.getCredentials();

    if (!creds.storeUrl || !creds.consumerKey || !creds.consumerSecret) {
      throw new Error('WooCommerce credentials are not configured. Please supply Store URL, Consumer Key, and Consumer Secret.');
    }

    const validation = this.validateStoreUrl(creds.storeUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const baseUrl = validation.normalized!;
    const parsedBase = new URL(baseUrl);
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedBase.hostname) || parsedBase.hostname.endsWith('.local');
    if (isLocal) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    const isHttps = parsedBase.protocol === 'https:';
    const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}/wp-json/wc/v3${endpointPath}`;

    const url = new URL(fullUrl);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    }

    const headers: Record<string, string> = {
      'User-Agent': 'WooCommerce-CRM-Connector/1.0',
      Accept: 'application/json',
    };

    if (isHttps) {
      const basicAuth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    } else {
      // Over HTTP, WooCommerce requires OAuth 1.0a HMAC-SHA256 signing
      const oauthParams: Record<string, string> = {
        oauth_consumer_key: creds.consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA256',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      };

      const allParams: Record<string, string> = { ...oauthParams };
      url.searchParams.forEach((v, k) => {
        allParams[k] = v;
      });

      const sortedKeys = Object.keys(allParams).sort();
      const paramString = sortedKeys
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
        .join('&');

      const baseString = `GET&${encodeURIComponent(fullUrl)}&${encodeURIComponent(paramString)}`;
      const signingKey = `${encodeURIComponent(creds.consumerSecret)}&`;
      const signature = crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');

      url.searchParams.set('oauth_consumer_key', oauthParams.oauth_consumer_key);
      url.searchParams.set('oauth_nonce', oauthParams.oauth_nonce);
      url.searchParams.set('oauth_signature_method', oauthParams.oauth_signature_method);
      url.searchParams.set('oauth_timestamp', oauthParams.oauth_timestamp);
      url.searchParams.set('oauth_signature', signature);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = `WooCommerce API Error (HTTP ${response.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) message = `${message}: ${parsed.message}`;
        } catch {
          // ignore parsing error
        }
        throw new Error(message);
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out connecting to WooCommerce store (15s timeout reached).');
      }
      if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(`Unable to reach WooCommerce store at ${baseUrl}. Ensure the store is online and reachable.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Tests the connection against official WooCommerce endpoint.
   * Real request to /wp-json/wc/v3/system_status or /wp-json/wc/v3.
   */
  public static async testConnection(creds?: WooCommerceCredentials): Promise<{
    success: boolean;
    storeName?: string;
    wcVersion?: string;
    message: string;
  }> {
    try {
      // Query 1 product or system info
      const products = await this.makeRequest<any[]>('/products', { per_page: 1 }, creds);
      const now = new Date().toISOString();

      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'last_sync_status',
        'connected',
        now,
      ]);
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'last_sync_error',
        '',
        now,
      ]);

      return {
        success: true,
        message: 'Successfully connected and authenticated with WooCommerce REST API v3.',
      };
    } catch (err: any) {
      const now = new Date().toISOString();
      const sanitizedMsg = err.message || 'Connection failed';
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'last_sync_status',
        'error',
        now,
      ]);
      run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'last_sync_error',
        sanitizedMsg,
        now,
      ]);
      return {
        success: false,
        message: sanitizedMsg,
      };
    }
  }

  /**
   * Performs an idempotent synchronization of products and product categories.
   * Product-only scope for PRM.
   * Supports incremental sync using modified_after.
   */
  public static async syncAll(options: { incremental?: boolean } = {}): Promise<{
    jobId: string;
    synced: { products: number; categories: number };
    errors: string[];
  }> {
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    const jobType = options.incremental ? 'incremental_sync' : 'full_sync';

    run(`
      INSERT INTO sync_jobs (id, job_type, status, entity_type, records_synced, records_failed, started_at)
      VALUES (?, ?, 'in_progress', 'products', 0, 0, ?)
    `, [jobId, jobType, now]);

    const lastSyncRow = get<{ value: string }>('SELECT value FROM integration_settings WHERE key = ?', ['last_sync_at']);
    const modifiedAfter = options.incremental && lastSyncRow?.value ? lastSyncRow.value : undefined;

    const stats = { products: 0, categories: 0 };
    const errorList: string[] = [];

    try {
      // 1. Sync Product Categories
      try {
        const categories = await this.fetchPaginated<any>('/products/categories', { per_page: 50 });
        for (const c of categories) {
          this.upsertCategory(c);
          stats.categories++;
        }
      } catch (err: any) {
        errorList.push(`Category sync error: ${err.message}`);
      }

      // 2. Sync Products
      try {
        const products = await this.fetchPaginated<any>('/products', modifiedAfter ? { modified_after: modifiedAfter } : {});
        for (const p of products) {
          this.upsertProduct(p, 'sync');
          stats.products++;
        }
      } catch (err: any) {
        errorList.push(`Product sync error: ${err.message}`);
      }

      const totalSynced = stats.products + stats.categories;
      const completedAt = new Date().toISOString();
      const jobStatus = errorList.length > 0 && totalSynced === 0 ? 'failed' : 'completed';

      run(`
        UPDATE sync_jobs
        SET status = ?, records_synced = ?, records_failed = ?, error_message = ?, completed_at = ?
        WHERE id = ?
      `, [jobStatus, totalSynced, errorList.length, errorList.join(' | ') || null, completedAt, jobId]);

      if (jobStatus === 'completed') {
        run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
          'last_sync_at',
          completedAt,
          completedAt,
        ]);
        run('INSERT OR REPLACE INTO integration_settings (key, value, updated_at) VALUES (?, ?, ?)', [
          'last_sync_status',
          'success',
          completedAt,
        ]);
      }

      return {
        jobId,
        synced: stats,
        errors: errorList,
      };
    } catch (err: any) {
      const failedAt = new Date().toISOString();
      run(`
        UPDATE sync_jobs
        SET status = 'failed', error_message = ?, completed_at = ?
        WHERE id = ?
      `, [err.message, failedAt, jobId]);
      throw err;
    }
  }

  /**
   * Helper to fetch paginated resources from WooCommerce.
   */
  private static async fetchPaginated<T>(endpoint: string, baseParams: Record<string, any> = {}): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    const perPage = 50;

    while (true) {
      const chunk = await this.makeRequest<T[]>(endpoint, {
        ...baseParams,
        page,
        per_page: perPage,
      });

      if (!Array.isArray(chunk) || chunk.length === 0) {
        break;
      }

      results.push(...chunk);
      if (chunk.length < perPage) {
        break; // Reached last page
      }
      page++;
      if (page > 20) break; // Sensible safety cap (1000 records max per sync batch)
    }

    return results;
  }

  /**
   * Upserts a WooCommerce category record idempotently.
   */
  public static upsertCategory(wcCat: any) {
    const existing = get<{ id: string }>('SELECT id FROM product_categories WHERE wc_category_id = ?', [wcCat.id]);
    const id = existing?.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const imageUrl = wcCat.image?.src || null;

    run(`
      INSERT INTO product_categories (
        id, wc_category_id, name, slug, description, parent_id, count, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        wc_category_id = excluded.wc_category_id,
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        parent_id = excluded.parent_id,
        count = excluded.count,
        image_url = excluded.image_url,
        updated_at = excluded.updated_at
    `, [
      id,
      wcCat.id,
      wcCat.name,
      wcCat.slug || '',
      wcCat.description || null,
      wcCat.parent || 0,
      wcCat.count || 0,
      imageUrl,
      now,
      now,
    ]);

    return id;
  }

  /**
   * Upserts a WooCommerce product record idempotently with full PRM attributes.
   */
  public static upsertProduct(wcProd: any, origin: RecordOrigin = 'sync') {
    const existing = get<{ id: string }>('SELECT id FROM products WHERE wc_product_id = ? OR (sku IS NOT NULL AND sku = ?)', [
      wcProd.id,
      wcProd.sku || '___non_existent___',
    ]);

    const id = existing?.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const price = parseFloat(wcProd.price || '0');
    const regularPrice = parseFloat(wcProd.regular_price || wcProd.price || '0');
    const salePrice = wcProd.sale_price ? parseFloat(wcProd.sale_price) : null;
    const categories = Array.isArray(wcProd.categories) ? JSON.stringify(wcProd.categories.map((c: any) => c.name)) : null;
    const imageUrl = wcProd.images && wcProd.images[0] ? wcProd.images[0].src : null;
    const productType = wcProd.type || 'simple';
    const featured = wcProd.featured ? 1 : 0;
    const manageStock = wcProd.manage_stock ? 1 : 0;
    const shortDesc = wcProd.short_description || null;
    const weight = wcProd.weight || null;
    const dimensions = wcProd.dimensions ? JSON.stringify(wcProd.dimensions) : null;
    const shippingClass = wcProd.shipping_class || null;
    const attributes = wcProd.attributes ? JSON.stringify(wcProd.attributes) : null;
    const variations = wcProd.variations ? JSON.stringify(wcProd.variations) : null;
    const permalink = wcProd.permalink || null;
    const tags = Array.isArray(wcProd.tags) ? JSON.stringify(wcProd.tags.map((t: any) => t.name)) : null;
    const images = Array.isArray(wcProd.images) ? JSON.stringify(wcProd.images.map((img: any) => ({ id: img.id, src: img.src, name: img.name }))) : null;

    run(`
      INSERT INTO products (
        id, wc_product_id, name, sku, price, regular_price, sale_price,
        stock_quantity, stock_status, status, product_type, featured, manage_stock,
        origin, categories, description, short_description, weight, dimensions_json,
        shipping_class, attributes_json, variations_json, permalink, tags_json,
        images_json, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        wc_product_id = excluded.wc_product_id,
        name = excluded.name,
        sku = excluded.sku,
        price = excluded.price,
        regular_price = excluded.regular_price,
        sale_price = excluded.sale_price,
        stock_quantity = excluded.stock_quantity,
        stock_status = excluded.stock_status,
        status = excluded.status,
        product_type = excluded.product_type,
        featured = excluded.featured,
        manage_stock = excluded.manage_stock,
        origin = excluded.origin,
        categories = excluded.categories,
        description = excluded.description,
        short_description = excluded.short_description,
        weight = excluded.weight,
        dimensions_json = excluded.dimensions_json,
        shipping_class = excluded.shipping_class,
        attributes_json = excluded.attributes_json,
        variations_json = excluded.variations_json,
        permalink = excluded.permalink,
        tags_json = excluded.tags_json,
        images_json = excluded.images_json,
        image_url = excluded.image_url,
        updated_at = excluded.updated_at
    `, [
      id,
      wcProd.id,
      wcProd.name || 'Unnamed Product',
      wcProd.sku || null,
      price,
      regularPrice,
      salePrice,
      wcProd.stock_quantity ?? (manageStock ? 0 : null),
      wcProd.stock_status || 'instock',
      wcProd.status || 'publish',
      productType,
      featured,
      manageStock,
      origin,
      categories,
      wcProd.description || null,
      shortDesc,
      weight,
      dimensions,
      shippingClass,
      attributes,
      variations,
      permalink,
      tags,
      images,
      imageUrl,
      wcProd.date_created || now,
      now,
    ]);

    return id;
  }

  /**
   * Upserts a WooCommerce customer record idempotently with duplicate prevention.
   */
  public static upsertCustomer(wcCust: any, origin: RecordOrigin = 'sync') {
    const rawEmail = wcCust.email || '';
    if (!rawEmail) return null;

    const emailNorm = rawEmail.trim().toLowerCase();
    const existing = get<{ id: string }>('SELECT id FROM customers WHERE email_normalized = ? OR wc_customer_id = ?', [
      emailNorm,
      wcCust.id || -1,
    ]);

    const id = existing?.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const billing = wcCust.billing || {};

    run(`
      INSERT INTO customers (
        id, wc_customer_id, email_normalized, email, first_name, last_name, phone,
        city, state, country, postcode, address_1, address_2, origin, is_guest,
        total_orders, lifetime_spend, registered_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        wc_customer_id = coalesce(excluded.wc_customer_id, customers.wc_customer_id),
        email_normalized = excluded.email_normalized,
        email = excluded.email,
        first_name = coalesce(excluded.first_name, customers.first_name),
        last_name = coalesce(excluded.last_name, customers.last_name),
        phone = coalesce(excluded.phone, customers.phone),
        city = coalesce(excluded.city, customers.city),
        state = coalesce(excluded.state, customers.state),
        country = coalesce(excluded.country, customers.country),
        postcode = coalesce(excluded.postcode, customers.postcode),
        address_1 = coalesce(excluded.address_1, customers.address_1),
        origin = excluded.origin,
        total_orders = excluded.total_orders,
        lifetime_spend = excluded.lifetime_spend,
        updated_at = excluded.updated_at
    `, [
      id,
      wcCust.id || null,
      emailNorm,
      rawEmail,
      wcCust.first_name || billing.first_name || null,
      wcCust.last_name || billing.last_name || null,
      billing.phone || null,
      billing.city || null,
      billing.state || null,
      billing.country || null,
      billing.postcode || null,
      billing.address_1 || null,
      billing.address_2 || null,
      origin,
      wcCust.orders_count || 0,
      parseFloat(wcCust.total_spent || '0'),
      wcCust.date_created || now,
      now,
      now,
    ]);

    return id;
  }

  /**
   * Upserts a WooCommerce order record idempotently with line items and customer association.
   */
  public static upsertOrder(wcOrder: any, origin: RecordOrigin = 'sync') {
    const existing = get<{ id: string }>('SELECT id FROM orders WHERE wc_order_id = ?', [wcOrder.id]);
    const id = existing?.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const rawEmail = (wcOrder.billing?.email || '').trim();
    const emailNorm = rawEmail.toLowerCase();
    const isGuest = wcOrder.customer_id === 0 || !wcOrder.customer_id;

    // Find or create customer
    let customerId: string | null = null;
    if (emailNorm) {
      const custRow = get<{ id: string }>('SELECT id FROM customers WHERE email_normalized = ?', [emailNorm]);
      if (custRow) {
        customerId = custRow.id;
      } else {
        // Create customer record from order billing
        customerId = crypto.randomUUID();
        const firstName = wcOrder.billing?.first_name || null;
        const lastName = wcOrder.billing?.last_name || null;
        run(`
          INSERT INTO customers (
            id, wc_customer_id, email_normalized, email, first_name, last_name, phone,
            city, state, country, postcode, address_1, address_2, origin, is_guest,
            total_orders, lifetime_spend, registered_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
        `, [
          customerId,
          isGuest ? null : wcOrder.customer_id,
          emailNorm,
          rawEmail,
          firstName,
          lastName,
          wcOrder.billing?.phone || null,
          wcOrder.billing?.city || null,
          wcOrder.billing?.state || null,
          wcOrder.billing?.country || null,
          wcOrder.billing?.postcode || null,
          wcOrder.billing?.address_1 || null,
          wcOrder.billing?.address_2 || null,
          origin,
          isGuest ? 1 : 0,
          wcOrder.date_created || now,
          now,
          now,
        ]);
      }
    }

    const customerName = `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim() || 'Guest Customer';

    run(`
      INSERT INTO orders (
        id, wc_order_id, customer_id, customer_email, customer_name, is_guest,
        status, currency, subtotal, tax_total, shipping_total, discount_total,
        total, payment_method, payment_method_title, shipping_method_title,
        origin, date_created, date_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        customer_id = excluded.customer_id,
        customer_email = excluded.customer_email,
        customer_name = excluded.customer_name,
        is_guest = excluded.is_guest,
        status = excluded.status,
        currency = excluded.currency,
        subtotal = excluded.subtotal,
        tax_total = excluded.tax_total,
        shipping_total = excluded.shipping_total,
        discount_total = excluded.discount_total,
        total = excluded.total,
        payment_method = excluded.payment_method,
        payment_method_title = excluded.payment_method_title,
        shipping_method_title = excluded.shipping_method_title,
        origin = excluded.origin,
        date_created = excluded.date_created,
        date_completed = excluded.date_completed,
        updated_at = excluded.updated_at
    `, [
      id,
      wcOrder.id,
      customerId,
      rawEmail,
      customerName,
      isGuest ? 1 : 0,
      wcOrder.status || 'processing',
      wcOrder.currency || 'USD',
      parseFloat(wcOrder.subtotal || wcOrder.total || '0'),
      parseFloat(wcOrder.total_tax || '0'),
      parseFloat(wcOrder.shipping_total || '0'),
      parseFloat(wcOrder.discount_total || '0'),
      parseFloat(wcOrder.total || '0'),
      wcOrder.payment_method || null,
      wcOrder.payment_method_title || null,
      wcOrder.shipping_lines && wcOrder.shipping_lines[0] ? wcOrder.shipping_lines[0].method_title : null,
      origin,
      wcOrder.date_created || now,
      wcOrder.date_completed || null,
      now,
      now,
    ]);

    // Replace line items
    run('DELETE FROM order_items WHERE order_id = ?', [id]);

    if (Array.isArray(wcOrder.line_items)) {
      for (const item of wcOrder.line_items) {
        // Link to existing product if found
        const prod = get<{ id: string }>('SELECT id FROM products WHERE wc_product_id = ? OR sku = ?', [
          item.product_id,
          item.sku || '___non_existent___',
        ]);

        run(`
          INSERT INTO order_items (id, order_id, product_id, wc_product_id, name, sku, quantity, price, subtotal, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          crypto.randomUUID(),
          id,
          prod?.id || null,
          item.product_id || null,
          item.name || 'Unnamed item',
          item.sku || null,
          item.quantity || 1,
          parseFloat(item.price || '0'),
          parseFloat(item.subtotal || item.total || '0'),
          parseFloat(item.total || '0'),
        ]);
      }
    }

    // Refresh customer total_orders and lifetime_spend
    if (customerId) {
      const stats = get<{ totalSpend: number; count: number }>(`
        SELECT COALESCE(SUM(total), 0) as totalSpend, COUNT(*) as count
        FROM orders
        WHERE customer_id = ? AND status NOT IN ('cancelled', 'refunded')
      `, [customerId]);

      if (stats) {
        run(`
          UPDATE customers
          SET total_orders = ?, lifetime_spend = ?, last_order_at = ?, updated_at = ?
          WHERE id = ?
        `, [stats.count, stats.totalSpend, wcOrder.date_created || now, now, customerId]);
      }
    }

    return id;
  }

  /**
   * Verifies HMAC-SHA256 signature for WooCommerce incoming webhooks.
   */
  public static verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    const creds = this.getCredentials();
    const secret = creds.webhookSecret;

    if (!secret || !signatureHeader) {
      return false;
    }

    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    const sigBuf = Buffer.from(signatureHeader);
    const compBuf = Buffer.from(computed);

    if (sigBuf.length !== compBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, compBuf);
  }
}
