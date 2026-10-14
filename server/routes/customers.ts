import crypto from 'node:crypto';
import { Router } from 'express';
import { query, get, run } from '../database/db.ts';
import { Customer, CustomerNote, Order, CommunicationActivity } from '../types/index.ts';

const router = Router();

// GET /api/customers - List with search, filtering, sorting, pagination
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10')));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim().toLowerCase();
    const origin = (req.query.origin as string || '').trim();
    const tag = (req.query.tag as string || '').trim();
    const sortBy = (req.query.sortBy as string || 'created_at').toLowerCase();
    const sortDir = (req.query.sortDir as string || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push(`(
        LOWER(c.email) LIKE ? OR
        LOWER(coalesce(c.first_name, '')) LIKE ? OR
        LOWER(coalesce(c.last_name, '')) LIKE ? OR
        LOWER(coalesce(c.phone, '')) LIKE ? OR
        LOWER(coalesce(c.city, '')) LIKE ?
      )`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (origin && ['demo', 'sync', 'imported'].includes(origin)) {
      conditions.push('c.origin = ?');
      params.push(origin);
    }

    if (tag) {
      conditions.push(`EXISTS (SELECT 1 FROM customer_tags WHERE customer_id = c.id AND LOWER(tag) = ?)`);
      params.push(tag.toLowerCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortColumns: Record<string, string> = {
      name: 'c.first_name',
      email: 'c.email_normalized',
      total_orders: 'c.total_orders',
      lifetime_spend: 'c.lifetime_spend',
      registered_at: 'c.registered_at',
      last_order_at: 'c.last_order_at',
      created_at: 'c.created_at',
    };
    const sortColumn = allowedSortColumns[sortBy] || 'c.created_at';

    // Total Count
    const countQuery = `SELECT COUNT(*) as c FROM customers c ${whereClause}`;
    const totalCount = get<{ c: number }>(countQuery, params)?.c || 0;

    // Paginated rows
    const dataQuery = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM customer_notes WHERE customer_id = c.id) as notes_count
      FROM customers c
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const customers = query<Customer>(dataQuery, [...params, limit, offset]);

    // Attach tags
    for (const cust of customers) {
      const tagsRows = query<{ tag: string }>('SELECT tag FROM customer_tags WHERE customer_id = ?', [cust.id]);
      cust.tags = tagsRows.map(t => t.tag);
    }

    res.json({
      success: true,
      data: {
        customers,
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

// GET /api/customers/:id - Customer details, notes, tags, orders, communications
router.get('/:id', (req, res) => {
  try {
    const customer = get<Customer>('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const tags = query<{ tag: string }>('SELECT tag FROM customer_tags WHERE customer_id = ?', [customer.id]).map(t => t.tag);
    const notes = query<CustomerNote>('SELECT * FROM customer_notes WHERE customer_id = ? ORDER BY created_at DESC', [customer.id]);
    const orders = query<Order>(`
      SELECT o.*,
             (SELECT count(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.date_created DESC
    `, [customer.id]);

    const communications = query<CommunicationActivity>(`
      SELECT * FROM communication_activities WHERE customer_id = ? ORDER BY timestamp DESC
    `, [customer.id]);

    res.json({
      success: true,
      data: {
        customer,
        tags,
        notes,
        orders,
        communications,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers - Manual Customer Creation with Duplicate Detection
router.post('/', (req, res) => {
  try {
    const { email, first_name, last_name, phone, city, state, country, postcode, address_1 } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    const emailNorm = email.trim().toLowerCase();
    const existing = get<{ id: string }>('SELECT id FROM customers WHERE email_normalized = ?', [emailNorm]);
    if (existing) {
      return res.status(409).json({ success: false, error: `Customer with email ${emailNorm} already exists.` });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    run(`
      INSERT INTO customers (
        id, wc_customer_id, email_normalized, email, first_name, last_name, phone,
        city, state, country, postcode, address_1, address_2, origin, is_guest,
        total_orders, lifetime_spend, registered_at, created_at, updated_at
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'demo', 0, 0, 0, ?, ?, ?)
    `, [
      id, emailNorm, email.trim(), first_name?.trim() || null, last_name?.trim() || null,
      phone?.trim() || null, city?.trim() || null, state?.trim() || null, country?.trim() || null,
      postcode?.trim() || null, address_1?.trim() || null, now, now, now
    ]);

    const created = get<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/:id/notes - Add note
router.post('/:id/notes', (req, res) => {
  try {
    const { note, author } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, error: 'Note text cannot be empty' });
    }

    const cust = get<{ id: string }>('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!cust) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    run(`
      INSERT INTO customer_notes (id, customer_id, author, note, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, req.params.id, author?.trim() || 'Agent', note.trim(), now]);

    const created = get<CustomerNote>('SELECT * FROM customer_notes WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/:id/tags - Add tag
router.post('/:id/tags', (req, res) => {
  try {
    const { tag } = req.body;
    if (!tag || !tag.trim()) {
      return res.status(400).json({ success: false, error: 'Tag cannot be empty' });
    }

    const cleanTag = tag.trim();
    const cust = get<{ id: string }>('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!cust) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    run(`
      INSERT OR IGNORE INTO customer_tags (id, customer_id, tag, created_at)
      VALUES (?, ?, ?, ?)
    `, [crypto.randomUUID(), req.params.id, cleanTag, new Date().toISOString()]);

    const tags = query<{ tag: string }>('SELECT tag FROM customer_tags WHERE customer_id = ?', [req.params.id]).map(t => t.tag);
    res.json({ success: true, data: tags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/customers/:id/tags/:tag - Remove tag
router.delete('/:id/tags/:tag', (req, res) => {
  try {
    run('DELETE FROM customer_tags WHERE customer_id = ? AND tag = ?', [req.params.id, req.params.tag]);
    const tags = query<{ tag: string }>('SELECT tag FROM customer_tags WHERE customer_id = ?', [req.params.id]).map(t => t.tag);
    res.json({ success: true, data: tags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
