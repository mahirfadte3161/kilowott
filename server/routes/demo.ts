import { Router } from 'express';
import { seedDatabase } from '../database/seed.ts';
import { db } from '../database/db.ts';

const router = Router();

// POST /api/demo/seed - Reset demo records to initial state
router.post('/seed', (req, res) => {
  try {
    seedDatabase(true);
    res.json({ success: true, message: 'Demo data successfully re-seeded.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/demo/clear - Clear only demo data
router.post('/clear', (req, res) => {
  try {
    db.exec(`
      DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE origin = 'demo');
      DELETE FROM communication_activities WHERE customer_id IN (SELECT id FROM customers WHERE origin = 'demo');
      DELETE FROM customer_notes WHERE customer_id IN (SELECT id FROM customers WHERE origin = 'demo');
      DELETE FROM customer_tags WHERE customer_id IN (SELECT id FROM customers WHERE origin = 'demo');
      DELETE FROM orders WHERE origin = 'demo';
      DELETE FROM customers WHERE origin = 'demo';
      DELETE FROM products WHERE origin = 'demo';
    `);
    res.json({ success: true, message: 'Demo records successfully removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
