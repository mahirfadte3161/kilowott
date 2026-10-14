import crypto from 'node:crypto';
import { Router } from 'express';
import { query, get, run } from '../database/db.ts';
import { CommunicationActivity } from '../types/index.ts';

const router = Router();

// GET /api/activity - Feed of communications and tasks
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '20')));
    const offset = (page - 1) * limit;

    const countRow = get<{ c: number }>('SELECT COUNT(*) as c FROM communication_activities');
    const totalCount = countRow?.c || 0;

    const activities = query<CommunicationActivity>(`
      SELECT 
        ca.*,
        c.first_name || ' ' || coalesce(c.last_name, '') as customer_name,
        c.email as customer_email,
        cmp.name as campaign_name
      FROM communication_activities ca
      JOIN customers c ON c.id = ca.customer_id
      LEFT JOIN campaigns cmp ON cmp.id = ca.campaign_id
      ORDER BY ca.timestamp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({
      success: true,
      data: {
        activities,
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

// POST /api/activity/task - Create a follow-up reminder / task
router.post('/task', (req, res) => {
  try {
    const { customer_id, subject, message } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Task subject is required' });
    }

    const cust = get<{ id: string }>('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (!cust) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    run(`
      INSERT INTO communication_activities (id, customer_id, campaign_id, type, subject, message, status, timestamp)
      VALUES (?, ?, NULL, 'reminder', ?, ?, 'pending', ?)
    `, [id, customer_id, subject.trim(), message?.trim() || '', now]);

    const created = get<CommunicationActivity>('SELECT * FROM communication_activities WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/activity/:id/status - Mark task completed / resolved
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    run('UPDATE communication_activities SET status = ? WHERE id = ?', [status || 'delivered', req.params.id]);
    const updated = get<CommunicationActivity>('SELECT * FROM communication_activities WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
