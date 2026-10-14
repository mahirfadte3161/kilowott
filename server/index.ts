import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboard.ts';
import customerRoutes from './routes/customers.ts';
import orderRoutes from './routes/orders.ts';
import productRoutes from './routes/products.ts';
import segmentRoutes from './routes/segments.ts';
import campaignRoutes from './routes/campaigns.ts';
import activityRoutes from './routes/activity.ts';
import woocommerceRoutes from './routes/woocommerce.ts';
import csvRoutes from './routes/csv.ts';
import pimRoutes from './routes/pim.ts';
import aiRoutes from './routes/ai.ts';
import demoRoutes from './routes/demo.ts';
import { db } from './database/db.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'connected',
    system: 'Kilowatt PIM',
  });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pim', pimRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/woocommerce', woocommerceRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/demo', demoRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Kilowatt PIM (Product Information Management) Server running on http://localhost:${PORT}`);
});

export default app;
