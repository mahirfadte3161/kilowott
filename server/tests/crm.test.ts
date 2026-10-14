import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { db, run, query, get } from '../database/db.ts';
import { WooCommerceService } from '../services/woocommerce.ts';
import { SegmentEngine } from '../services/segmentEngine.ts';
import { CSVEngine } from '../services/csvEngine.ts';

describe('WooCommerce CRM Comprehensive Test Suite', () => {
  before(() => {
    // Ensure DB tables exist
    assert.ok(db, 'Database should be initialized');
  });

  // 1. Store URL Validation & HTTPS Security
  describe('WooCommerce Store URL Validation', () => {
    test('requires HTTPS for remote store URLs', () => {
      const res = WooCommerceService.validateStoreUrl('http://myshop.com');
      assert.strictEqual(res.valid, false);
      assert.match(res.error || '', /Remote WooCommerce stores must use HTTPS/);
    });

    test('permits HTTP for localhost and local development domains', () => {
      const res1 = WooCommerceService.validateStoreUrl('http://localhost:8080');
      assert.strictEqual(res1.valid, true);

      const res2 = WooCommerceService.validateStoreUrl('http://127.0.0.1:8000');
      assert.strictEqual(res2.valid, true);

      const res3 = WooCommerceService.validateStoreUrl('http://crm-demo-store.local');
      assert.strictEqual(res3.valid, true);
    });

    test('accepts valid HTTPS store URLs and strips trailing slash', () => {
      const res = WooCommerceService.validateStoreUrl('https://demo.woostore.com/');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalized, 'https://demo.woostore.com');
    });

    test('rejects malformed or empty URLs', () => {
      const res1 = WooCommerceService.validateStoreUrl('');
      assert.strictEqual(res1.valid, false);

      const res2 = WooCommerceService.validateStoreUrl('not-a-valid-url');
      assert.strictEqual(res2.valid, false);
    });
  });

  // 2. Credential Security & Masking
  describe('Credential Security & Public Masking', () => {
    test('masks consumer key and never exposes raw secrets to client', () => {
      WooCommerceService.updateCredentials({
        consumerKey: 'ck_1234567890abcdef1234567890abcdef',
        consumerSecret: 'cs_secret_should_never_leak',
      });

      const publicStatus = WooCommerceService.getPublicStatus();
      assert.ok(publicStatus.consumerKeyMasked.startsWith('ck_12...'));
      assert.ok(!JSON.stringify(publicStatus).includes('cs_secret_should_never_leak'));
      assert.strictEqual(publicStatus.hasConsumerSecret, true);
    });
  });

  // 3. Customer Upserting & Duplicate Detection
  describe('Customer Deduplication & Email Normalization', () => {
    test('normalizes email addresses and prevents duplicate customer creation', () => {
      const testEmail = `TEST.USER.${Date.now()}@Example.Com  `;
      const normalized = testEmail.trim().toLowerCase();

      // Upsert first time
      const id1 = WooCommerceService.upsertCustomer({
        id: 9901,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
      }, 'sync');

      assert.ok(id1);

      // Upsert second time with same email in lowercase
      const id2 = WooCommerceService.upsertCustomer({
        id: 9901,
        email: normalized,
        first_name: 'TestUpdated',
        last_name: 'User',
      }, 'sync');

      assert.strictEqual(id1, id2, 'Customer record IDs must match on duplicate email');

      // Verify DB record
      const record = get<any>('SELECT * FROM customers WHERE email_normalized = ?', [normalized]);
      assert.strictEqual(record.first_name, 'TestUpdated');
    });
  });

  // 4. Order Upserting & Guest Checkout Association
  describe('Order Processing & Guest Checkouts', () => {
    test('upserts orders idempotently and handles guest orders', () => {
      const guestEmail = `guest.${Date.now()}@example.org`;

      const orderPayload = {
        id: 88801,
        customer_id: 0, // guest
        status: 'processing',
        currency: 'USD',
        total: '149.99',
        subtotal: '135.00',
        total_tax: '14.99',
        billing: {
          first_name: 'GuestBuyer',
          last_name: 'Anonymous',
          email: guestEmail,
        },
        line_items: [
          {
            product_id: 101,
            name: 'Apex Pro Keyboard',
            quantity: 1,
            price: '135.00',
            total: '135.00',
          },
        ],
      };

      const orderId = WooCommerceService.upsertOrder(orderPayload, 'sync');
      assert.ok(orderId);

      const savedOrder = get<any>('SELECT * FROM orders WHERE wc_order_id = ?', [88801]);
      assert.strictEqual(savedOrder.is_guest, 1);
      assert.strictEqual(savedOrder.status, 'processing');
      assert.strictEqual(savedOrder.total, 149.99);

      // Verify line items created
      const items = query<any>('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].name, 'Apex Pro Keyboard');
    });
  });

  // 5. Rule-Based Dynamic Segmentation
  describe('Customer Segmentation Engine', () => {
    test('evaluates high-value and repeat customer rules from database', () => {
      const allSegments = SegmentEngine.getAllSegmentsWithCounts();
      assert.ok(allSegments.length >= 5);

      const highValueSeg = allSegments.find(s => s.rule_type === 'high_value');
      assert.ok(highValueSeg);
      assert.ok(typeof highValueSeg.member_count === 'number');

      const repeatSeg = allSegments.find(s => s.rule_type === 'repeat');
      assert.ok(repeatSeg);
      assert.ok(typeof repeatSeg.member_count === 'number');
    });

    test('generates analytical insights based on actual customer distribution', () => {
      const insights = SegmentEngine.generateInsights();
      assert.strictEqual(insights.hasData, true);
      assert.ok(Array.isArray(insights.insights));
      assert.ok(insights.insights.length >= 3);
    });
  });

  // 6. CSV Engine Parsing & Validation
  describe('CSV Parsing & Validation Engine', () => {
    test('parses RFC 4180 CSV with quotes and commas safely', () => {
      const csv = `first_name,last_name,email,city\n"John, Jr.",Doe,john.jr@example.com,"New York, NY"\nAlice,Smith,alice@example.com,Seattle`;
      const parsed = CSVEngine.parseCSV(csv);

      assert.strictEqual(parsed.totalRows, 2);
      assert.strictEqual(parsed.headers.length, 4);
      assert.strictEqual(parsed.rows[0].first_name, 'John, Jr.');
      assert.strictEqual(parsed.rows[0].city, 'New York, NY');
      assert.strictEqual(parsed.rows[1].email, 'alice@example.com');
    });

    test('detects invalid emails and reports row-level errors during customer import', () => {
      const uniqueValidEmail = `valid.${Date.now()}@example.com`;
      const rows = [
        { first_name: 'Valid', email: uniqueValidEmail, phone: '123' },
        { first_name: 'Invalid', email: 'not-an-email-address', phone: '456' },
        { first_name: 'Missing', email: '', phone: '789' },
      ];

      const mapping = { email: 'email', first_name: 'first_name' };
      const res = CSVEngine.importCustomers(rows, mapping);

      assert.strictEqual(res.imported, 1);
      assert.strictEqual(res.failed, 2);
      assert.strictEqual(res.errors.length, 2);
      assert.match(res.errors[0].message, /Invalid email format/);
    });

    test('generates valid export CSV files for customers and products', () => {
      const custCsv = CSVEngine.exportCustomers();
      assert.ok(custCsv.includes('CRM Customer ID'));
      assert.ok(custCsv.includes('Email'));

      const prodCsv = CSVEngine.exportProducts();
      assert.ok(prodCsv.includes('CRM Product ID'));
      assert.ok(prodCsv.includes('SKU'));
    });
  });

  // 7. Webhook HMAC-SHA256 Signature Verification
  describe('WooCommerce Webhook HMAC Signature Verification', () => {
    test('verifies genuine webhook signatures and rejects tampered payloads', () => {
      const secret = 'super_secret_webhook_key_123';
      WooCommerceService.updateCredentials({ webhookSecret: secret });

      const payload = JSON.stringify({ id: 1001, status: 'completed' });
      const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64');

      const isVerified = WooCommerceService.verifyWebhookSignature(payload, validSignature);
      assert.strictEqual(isVerified, true, 'Valid signature must be accepted');

      const isTampered = WooCommerceService.verifyWebhookSignature(payload + 'tampered', validSignature);
      assert.strictEqual(isTampered, false, 'Tampered payload must be rejected');

      const isWrongSig = WooCommerceService.verifyWebhookSignature(payload, 'wrong_signature');
      assert.strictEqual(isWrongSig, false, 'Invalid signature must be rejected');
    });
  });
});
