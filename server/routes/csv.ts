import { Router } from 'express';
import multer from 'multer';
import { CSVEngine } from '../services/csvEngine.ts';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/csv/preview - Parse uploaded CSV and return column structure & preview rows
router.post('/preview', upload.single('file'), (req, res) => {
  try {
    let csvContent = '';
    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
    } else if (req.body.csvText) {
      csvContent = req.body.csvText;
    } else {
      return res.status(400).json({ success: false, error: 'No CSV file or text provided' });
    }

    const parsed = CSVEngine.parseCSV(csvContent);

    res.json({
      success: true,
      data: {
        headers: parsed.headers,
        previewRows: parsed.rows.slice(0, 5),
        totalRows: parsed.totalRows,
        rawRows: parsed.rows, // full parsed rows for subsequent commit
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/csv/import/customers - Execute customer CSV import
router.post('/import/customers', (req, res) => {
  try {
    const { rows, columnMapping, onDuplicate } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No rows to import' });
    }
    if (!columnMapping || !columnMapping.email) {
      return res.status(400).json({ success: false, error: 'Column mapping for "email" is required' });
    }

    const result = CSVEngine.importCustomers(rows, columnMapping, onDuplicate);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/csv/import/products - Execute product CSV import
router.post('/import/products', (req, res) => {
  try {
    const { rows, columnMapping } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No rows to import' });
    }
    if (!columnMapping || !columnMapping.name) {
      return res.status(400).json({ success: false, error: 'Column mapping for "name" is required' });
    }

    const result = CSVEngine.importProducts(rows, columnMapping);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/csv/import/orders - Execute order CSV import
router.post('/import/orders', (req, res) => {
  try {
    const { rows, columnMapping } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No rows to import' });
    }
    if (!columnMapping || !columnMapping.customer_email) {
      return res.status(400).json({ success: false, error: 'Column mapping for "customer_email" is required' });
    }

    const result = CSVEngine.importOrders(rows, columnMapping);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/csv/export/customers
router.get('/export/customers', (req, res) => {
  try {
    const csv = CSVEngine.exportCustomers();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="woocommerce-crm-customers.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/csv/export/orders
router.get('/export/orders', (req, res) => {
  try {
    const csv = CSVEngine.exportOrders();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="woocommerce-crm-orders.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/csv/export/products
router.get('/export/products', (req, res) => {
  try {
    const csv = CSVEngine.exportProducts();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="woocommerce-prm-products.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
