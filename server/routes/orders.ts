import { Router } from 'express';
import { query, get, run } from '../database/db.ts';
import { Order, OrderItem, WooCommerceOrderStatus } from '../types/index.ts';

const router = Router();

// GET /api/orders - List with search, status filtering, origin filtering, pagination
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10')));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim().toLowerCase();
    const status = (req.query.status as string || '').trim().toLowerCase();
    const origin = (req.query.origin as string || '').trim();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push(`(
        LOWER(o.customer_name) LIKE ? OR
        LOWER(o.customer_email) LIKE ? OR
        CAST(o.wc_order_id AS TEXT) LIKE ? OR
        o.id LIKE ?
      )`);
      const sParam = `%${search}%`;
      params.push(sParam, sParam, sParam, sParam);
    }

    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (origin && ['demo', 'sync', 'imported'].includes(origin)) {
      conditions.push('o.origin = ?');
      params.push(origin);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as c FROM orders o ${whereClause}`;
    const totalCount = get<{ c: number }>(countQuery, params)?.c || 0;

    const ordersQuery = `
      SELECT 
        o.*,
        (SELECT count(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ${whereClause}
      ORDER BY o.date_created DESC
      LIMIT ? OFFSET ?
    `;

    const orders = query<Order>(ordersQuery, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        orders,
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

// GET /api/orders/:id - Order details with line items and customer link
router.get('/:id', (req, res) => {
  try {
    const order = get<Order>('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const items = query<OrderItem>('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;

    // Customer summary if linked
    let customer = null;
    if (order.customer_id) {
      customer = get<any>('SELECT id, first_name, last_name, email, phone, city, total_orders, lifetime_spend FROM customers WHERE id = ?', [order.customer_id]);
    }

    // Customer's other previous orders
    let previousOrders: Order[] = [];
    if (order.customer_id || order.customer_email) {
      previousOrders = query<Order>(`
        SELECT id, wc_order_id, status, total, currency, date_created
        FROM orders
        WHERE (customer_id = ? OR customer_email = ?) AND id != ?
        ORDER BY date_created DESC
        LIMIT 5
      `, [order.customer_id || '', order.customer_email, order.id]);
    }

    res.json({
      success: true,
      data: {
        order,
        customer,
        previousOrders,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update order fulfillment / payment status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body as { status: WooCommerceOrderStatus };
    const validStatuses: WooCommerceOrderStatus[] = ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid order status: ${status}` });
    }

    const order = get<Order>('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const now = new Date().toISOString();
    const dateCompleted = status === 'completed' ? now : order.date_completed;

    run(`
      UPDATE orders
      SET status = ?, date_completed = ?, updated_at = ?
      WHERE id = ?
    `, [status, dateCompleted, now, req.params.id]);

    const updated = get<Order>('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
