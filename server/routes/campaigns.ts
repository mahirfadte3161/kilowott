import crypto from 'node:crypto';
import { Router } from 'express';
import { query, get, run } from '../database/db.ts';
import { SegmentEngine } from '../services/segmentEngine.ts';
import { Campaign, Segment } from '../types/index.ts';

const router = Router();

// GET /api/campaigns - List campaigns with target segment info
router.get('/', (req, res) => {
  try {
    const campaigns = query<Campaign>(`
      SELECT 
        c.*,
        s.name as target_segment_name
      FROM campaigns c
      LEFT JOIN segments s ON s.id = c.target_segment_id
      ORDER BY c.created_at DESC
    `);

    res.json({ success: true, data: campaigns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/campaigns/:id - Campaign details & audience preview
router.get('/:id', (req, res) => {
  try {
    const campaign = get<Campaign>(`
      SELECT c.*, s.name as target_segment_name
      FROM campaigns c
      LEFT JOIN segments s ON s.id = c.target_segment_id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Audience calculation
    const targetCustomers = campaign.target_segment_id 
      ? SegmentEngine.getSegmentCustomers(campaign.target_segment_id)
      : [];

    res.json({
      success: true,
      data: {
        campaign,
        audienceCount: targetCustomers.length,
        audienceSample: targetCustomers.slice(0, 5).map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Valued Customer',
          email: c.email,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/campaigns - Create new campaign draft
router.post('/', (req, res) => {
  try {
    const { name, subject, channel, target_segment_id, template_body } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Campaign name is required' });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Email subject line is required' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    run(`
      INSERT INTO campaigns (id, name, subject, channel, target_segment_id, template_body, status, sent_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, ?, ?)
    `, [
      id,
      name.trim(),
      subject.trim(),
      channel || 'email',
      target_segment_id || null,
      template_body || '',
      now,
      now,
    ]);

    const created = get<Campaign>('SELECT * FROM campaigns WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', (req, res) => {
  try {
    const { name, subject, channel, target_segment_id, template_body, status } = req.body;
    const now = new Date().toISOString();

    run(`
      UPDATE campaigns
      SET name = coalesce(?, name),
          subject = coalesce(?, subject),
          channel = coalesce(?, channel),
          target_segment_id = coalesce(?, target_segment_id),
          template_body = coalesce(?, template_body),
          status = coalesce(?, status),
          updated_at = ?
      WHERE id = ?
    `, [name, subject, channel, target_segment_id, template_body, status, now, req.params.id]);

    const updated = get<Campaign>('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/campaigns/:id/send - Dispatch or simulate campaign dispatch
router.post('/:id/send', (req, res) => {
  try {
    const campaign = get<Campaign>('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const recipients = campaign.target_segment_id 
      ? SegmentEngine.getSegmentCustomers(campaign.target_segment_id)
      : [];

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients match the target segment.' });
    }

    const now = new Date().toISOString();

    // Log communication activity for every targeted customer
    for (const cust of recipients) {
      const renderedBody = campaign.template_body
        .replace(/{{first_name}}/g, cust.first_name || 'Valued Customer')
        .replace(/{{last_name}}/g, cust.last_name || '')
        .replace(/{{email}}/g, cust.email);

      run(`
        INSERT INTO communication_activities (id, customer_id, campaign_id, type, subject, message, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, 'sent', ?)
      `, [
        crypto.randomUUID(),
        cust.id,
        campaign.id,
        campaign.channel,
        campaign.subject,
        renderedBody,
        now,
      ]);
    }

    // Update campaign status
    run(`
      UPDATE campaigns
      SET status = 'sent', sent_count = sent_count + ?, updated_at = ?
      WHERE id = ?
    `, [recipients.length, now, campaign.id]);

    res.json({
      success: true,
      data: {
        sentCount: recipients.length,
        status: 'sent',
        message: `Campaign dispatched to ${recipients.length} recipients in target segment.`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
