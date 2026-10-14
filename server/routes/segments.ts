import crypto from 'node:crypto';
import { Router } from 'express';
import { query, get, run } from '../database/db.ts';
import { SegmentEngine } from '../services/segmentEngine.ts';
import { Segment } from '../types/index.ts';

const router = Router();

// GET /api/segments - List all segments with member counts
router.get('/', (req, res) => {
  try {
    const segments = SegmentEngine.getAllSegmentsWithCounts();
    res.json({ success: true, data: segments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/segments/insights - Customer analytics & behavioral insights
router.get('/insights', (req, res) => {
  try {
    const insights = SegmentEngine.generateInsights();
    res.json({ success: true, data: insights });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/segments/:id/customers - Members of a specific segment
router.get('/:id/customers', (req, res) => {
  try {
    const segment = get<Segment>('SELECT * FROM segments WHERE id = ?', [req.params.id]);
    if (!segment) {
      return res.status(404).json({ success: false, error: 'Segment not found' });
    }

    const customers = SegmentEngine.getSegmentCustomers(segment.id);
    res.json({
      success: true,
      data: {
        segment,
        customers,
        totalMembers: customers.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/segments - Create new custom segment
router.post('/', (req, res) => {
  try {
    const { name, description, rule_type, rule_config } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Segment name is required' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const configJson = typeof rule_config === 'object' ? JSON.stringify(rule_config) : (rule_config || '{}');

    run(`
      INSERT INTO segments (id, name, description, rule_type, rule_config_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name.trim(), description?.trim() || null, rule_type || 'custom', configJson, now, now]);

    const created = get<Segment>('SELECT * FROM segments WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
