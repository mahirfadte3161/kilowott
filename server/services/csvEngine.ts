import crypto from 'node:crypto';
import { db, run, get, query } from '../database/db.ts';
import { Customer, Order, Product, RecordOrigin } from '../types/index.ts';

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface CSVImportResult {
  totalProcessed: number;
  imported: number;
  duplicatesSkipped: number;
  duplicatesUpdated: number;
  failed: number;
  errors: { row: number; identifier?: string; message: string }[];
}

export class CSVEngine {
  /**
   * Robust RFC 4180 compliant CSV parser.
   * Handles quoted cells, commas inside quotes, multiline values, and CRLF.
   */
  public static parseCSV(text: string): CSVParseResult {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    // Normalize line endings
    const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const nextChar = cleaned[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' && !insideQuotes) {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField || currentLine.length > 0) {
      currentLine.push(currentField.trim());
      if (currentLine.some(f => f.length > 0)) {
        lines.push(currentLine);
      }
    }

    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const headers = lines[0].map(h => h.trim());
    const rows: Record<string, string>[] = [];

    for (let r = 1; r < lines.length; r++) {
      const rowArr = lines[r];
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = rowArr[idx] !== undefined ? rowArr[idx].trim() : '';
      });
      rows.push(obj);
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
    };
  }

  /**
   * Converts array of objects to RFC 4180 formatted CSV string.
   */
  public static generateCSV(headers: { key: string; label: string }[], data: Record<string, any>[]): string {
    const escapeField = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(h => escapeField(h.label)).join(',');
    const rowLines = data.map(item => {
      return headers.map(h => escapeField(item[h.key])).join(',');
    });

    return [headerLine, ...rowLines].join('\r\n');
  }

  /**
   * Imports customer records from CSV with mapping, validation, duplicate check, and error reporting.
   */
  public static importCustomers(
    rows: Record<string, string>[],
    columnMapping: Record<string, string>, // standardKey -> csvHeader
    onDuplicate: 'update' | 'skip' = 'update'
  ): CSVImportResult {
    const result: CSVImportResult = {
      totalProcessed: rows.length,
      imported: 0,
      duplicatesSkipped: 0,
      duplicatesUpdated: 0,
      failed: 0,
      errors: [],
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 header, +1 1-based index

      const emailHeader = columnMapping['email'];
      const rawEmail = (row[emailHeader] || '').trim();

      if (!rawEmail) {
        result.failed++;
        result.errors.push({ row: rowNumber, message: 'Email address is missing or empty' });
        continue;
      }

      if (!emailRegex.test(rawEmail)) {
        result.failed++;
        result.errors.push({ row: rowNumber, identifier: rawEmail, message: `Invalid email format: ${rawEmail}` });
        continue;
      }

      const emailNorm = rawEmail.toLowerCase();
      const firstName = (row[columnMapping['first_name']] || '').trim() || null;
      const lastName = (row[columnMapping['last_name']] || '').trim() || null;
      const phone = (row[columnMapping['phone']] || '').trim() || null;
      const city = (row[columnMapping['city']] || '').trim() || null;
      const state = (row[columnMapping['state']] || '').trim() || null;
      const country = (row[columnMapping['country']] || '').trim() || null;
      const postcode = (row[columnMapping['postcode']] || '').trim() || null;
      const address1 = (row[columnMapping['address_1']] || '').trim() || null;

      // Check duplicate
      const existing = get<{ id: string }>('SELECT id FROM customers WHERE email_normalized = ?', [emailNorm]);

      if (existing) {
        if (onDuplicate === 'skip') {
          result.duplicatesSkipped++;
          continue;
        }

        // Update
        run(`
          UPDATE customers
          SET first_name = coalesce(?, first_name),
              last_name = coalesce(?, last_name),
              phone = coalesce(?, phone),
              city = coalesce(?, city),
              state = coalesce(?, state),
              country = coalesce(?, country),
              postcode = coalesce(?, postcode),
              address_1 = coalesce(?, address_1),
              origin = 'imported',
              updated_at = ?
          WHERE id = ?
        `, [firstName, lastName, phone, city, state, country, postcode, address1, now, existing.id]);

        result.duplicatesUpdated++;
      } else {
        // Insert new
        const newId = crypto.randomUUID();
        run(`
          INSERT INTO customers (
            id, email_normalized, email, first_name, last_name, phone,
            city, state, country, postcode, address_1, origin, is_guest,
            total_orders, lifetime_spend, registered_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'imported', 0, 0, 0, ?, ?, ?)
        `, [
          newId, emailNorm, rawEmail, firstName, lastName, phone,
          city, state, country, postcode, address1, now, now, now
        ]);

        result.imported++;
      }
    }

    return result;
  }

  /**
   * Imports products from CSV.
   */
  public static importProducts(
    rows: Record<string, string>[],
    columnMapping: Record<string, string>
  ): CSVImportResult {
    const result: CSVImportResult = {
      totalProcessed: rows.length,
      imported: 0,
      duplicatesSkipped: 0,
      duplicatesUpdated: 0,
      failed: 0,
      errors: [],
    };

    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const name = (row[columnMapping['name']] || '').trim();
      const sku = (row[columnMapping['sku']] || '').trim() || null;
      const priceStr = (row[columnMapping['price']] || '0').trim().replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr);
      const regularPriceStr = (row[columnMapping['regular_price']] || priceStr).trim().replace(/[^0-9.]/g, '');
      const regularPrice = regularPriceStr ? parseFloat(regularPriceStr) : price;
      const salePriceStr = (row[columnMapping['sale_price']] || '').trim().replace(/[^0-9.]/g, '');
      const salePrice = salePriceStr ? parseFloat(salePriceStr) : null;
      const stockQtyStr = (row[columnMapping['stock_quantity']] || '').trim().replace(/[^0-9-]/g, '');
      const stockQuantity = stockQtyStr !== '' ? parseInt(stockQtyStr, 10) : 0;
      const stockStatus = (row[columnMapping['stock_status']] || (stockQuantity > 0 ? 'instock' : 'outofstock')).trim().toLowerCase();
      const description = (row[columnMapping['description']] || '').trim() || null;
      const categories = (row[columnMapping['categories']] || 'Uncategorized').trim();
      const productType = (row[columnMapping['product_type']] || 'simple').trim().toLowerCase();
      const status = (row[columnMapping['status']] || 'publish').trim().toLowerCase();
      const imageUrl = (row[columnMapping['image_url']] || '').trim() || null;

      if (!name) {
        result.failed++;
        result.errors.push({ row: rowNumber, message: 'Product name is required' });
        continue;
      }

      if (isNaN(price)) {
        result.failed++;
        result.errors.push({ row: rowNumber, identifier: name, message: 'Invalid price value' });
        continue;
      }

      const existing = sku ? get<{ id: string }>('SELECT id FROM products WHERE sku = ?', [sku]) : null;

      if (existing) {
        run(`
          UPDATE products
          SET name = ?, price = ?, regular_price = ?, sale_price = ?,
              stock_quantity = ?, stock_status = ?, description = COALESCE(?, description),
              categories = ?, product_type = ?, status = ?, image_url = COALESCE(?, image_url),
              origin = 'imported', updated_at = ?
          WHERE id = ?
        `, [name, price, regularPrice, salePrice, stockQuantity, stockStatus, description, categories, productType, status, imageUrl, now, existing.id]);
        result.duplicatesUpdated++;
      } else {
        const id = crypto.randomUUID();
        run(`
          INSERT INTO products (
            id, name, sku, price, regular_price, sale_price, stock_quantity, stock_status,
            manage_stock, status, product_type, description, categories, image_url,
            origin, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 'imported', ?, ?)
        `, [id, name, sku, price, regularPrice, salePrice, stockQuantity, stockStatus, status, productType, description, categories, imageUrl, now, now]);
        result.imported++;
      }
    }

    return result;
  }

  /**
   * Imports orders from CSV with customer linking and financial summary recalculation.
   */
  public static importOrders(
    rows: Record<string, string>[],
    columnMapping: Record<string, string>
  ): CSVImportResult {
    const result: CSVImportResult = {
      totalProcessed: rows.length,
      imported: 0,
      duplicatesSkipped: 0,
      duplicatesUpdated: 0,
      failed: 0,
      errors: [],
    };

    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const emailHeader = columnMapping['customer_email'];
      const rawEmail = (row[emailHeader] || '').trim();
      const customerName = (row[columnMapping['customer_name']] || '').trim() || 'Guest Customer';
      const totalStr = (row[columnMapping['total']] || '0').trim().replace(/[^0-9.]/g, '');
      const total = parseFloat(totalStr);
      const status = (row[columnMapping['status']] || 'completed').trim().toLowerCase();
      const orderDate = (row[columnMapping['date_created']] || now).trim();
      const wcOrderIdStr = (row[columnMapping['order_number']] || '').trim().replace(/[^0-9]/g, '');
      const wcOrderId = wcOrderIdStr ? parseInt(wcOrderIdStr) : null;

      if (!rawEmail || !rawEmail.includes('@')) {
        result.failed++;
        result.errors.push({ row: rowNumber, message: 'Valid customer email is required to associate order' });
        continue;
      }

      if (isNaN(total)) {
        result.failed++;
        result.errors.push({ row: rowNumber, message: 'Invalid total amount' });
        continue;
      }

      const emailNorm = rawEmail.toLowerCase();
      let customer = get<{ id: string }>('SELECT id FROM customers WHERE email_normalized = ?', [emailNorm]);

      if (!customer) {
        // Create customer record automatically for this order
        const newCustId = crypto.randomUUID();
        run(`
          INSERT INTO customers (
            id, email_normalized, email, first_name, last_name, origin, is_guest,
            total_orders, lifetime_spend, registered_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, '', 'imported', 0, 0, 0, ?, ?, ?)
        `, [newCustId, emailNorm, rawEmail, customerName, orderDate, orderDate, orderDate]);
        customer = { id: newCustId };
      }

      const orderId = crypto.randomUUID();
      run(`
        INSERT INTO orders (
          id, wc_order_id, customer_id, customer_email, customer_name, is_guest,
          status, currency, subtotal, tax_total, shipping_total, discount_total,
          total, origin, date_created, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?, 'USD', ?, 0, 0, 0, ?, 'imported', ?, ?, ?)
      `, [orderId, wcOrderId, customer.id, rawEmail, customerName, status, total, total, orderDate, now, now]);

      // Update customer stats
      run(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            lifetime_spend = lifetime_spend + ?,
            last_order_at = CASE WHEN last_order_at IS NULL OR last_order_at < ? THEN ? ELSE last_order_at END,
            updated_at = ?
        WHERE id = ?
      `, [total, orderDate, orderDate, now, customer.id]);

      result.imported++;
    }

    return result;
  }

  /**
   * Exports Customers to CSV string.
   */
  public static exportCustomers(): string {
    const customers = query<Customer>(`
      SELECT c.*, 
             COALESCE(group_concat(t.tag, '; '), '') as tags_list
      FROM customers c
      LEFT JOIN customer_tags t ON t.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    const headers = [
      { key: 'id', label: 'CRM Customer ID' },
      { key: 'wc_customer_id', label: 'WooCommerce Customer ID' },
      { key: 'origin', label: 'Record Origin' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      { key: 'postcode', label: 'Postal Code' },
      { key: 'total_orders', label: 'Total Orders' },
      { key: 'lifetime_spend', label: 'Lifetime Spend (USD)' },
      { key: 'registered_at', label: 'Registered Date' },
      { key: 'last_order_at', label: 'Last Order Date' },
      { key: 'tags_list', label: 'Customer Tags' },
    ];

    return this.generateCSV(headers, customers);
  }

  /**
   * Exports Orders to CSV string.
   */
  public static exportOrders(): string {
    const orders = query<Order>(`
      SELECT o.*,
             (SELECT count(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.date_created DESC
    `);

    const headers = [
      { key: 'id', label: 'CRM Order ID' },
      { key: 'wc_order_id', label: 'WooCommerce Order ID' },
      { key: 'origin', label: 'Record Origin' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_email', label: 'Customer Email' },
      { key: 'is_guest', label: 'Guest Checkout (1/0)' },
      { key: 'status', label: 'Order Status' },
      { key: 'currency', label: 'Currency' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax_total', label: 'Tax' },
      { key: 'shipping_total', label: 'Shipping' },
      { key: 'discount_total', label: 'Discounts' },
      { key: 'total', label: 'Total Amount' },
      { key: 'payment_method_title', label: 'Payment Method' },
      { key: 'date_created', label: 'Order Date' },
    ];

    return this.generateCSV(headers, orders);
  }

  /**
   * Exports Products to CSV string with full PRM specifications.
   */
  public static exportProducts(): string {
    const products = query<any>(`
      SELECT * FROM products ORDER BY name ASC
    `);

    const headers = [
      { key: 'id', label: 'PRM Product ID' },
      { key: 'wc_product_id', label: 'WooCommerce Product ID' },
      { key: 'name', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'product_type', label: 'Product Type' },
      { key: 'price', label: 'Current Price' },
      { key: 'regular_price', label: 'Regular Price' },
      { key: 'sale_price', label: 'Sale Price' },
      { key: 'stock_quantity', label: 'Stock Quantity' },
      { key: 'stock_status', label: 'Stock Status' },
      { key: 'manage_stock', label: 'Manage Stock (1/0)' },
      { key: 'status', label: 'Publish Status' },
      { key: 'featured', label: 'Featured (1/0)' },
      { key: 'categories', label: 'Categories' },
      { key: 'permalink', label: 'Permalink URL' },
      { key: 'origin', label: 'Record Origin' },
      { key: 'created_at', label: 'Created At' },
      { key: 'updated_at', label: 'Updated At' },
    ];

    return this.generateCSV(headers, products);
  }
}
