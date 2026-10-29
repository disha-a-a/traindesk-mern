import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import trainerRoutes from './src/routes/trainerRoutes.js';
import scheduleRoutes from './src/routes/scheduleRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import { seedDatabase } from './src/seed.js';
import { Trainer } from './src/models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  // Fix Vercel serverless path rewrite if req.url was changed to /server.js
  const forwardedPath = req.headers['x-matched-path'] || req.headers['x-now-route-matches'];
  if (req.url === '/server.js' && forwardedPath) {
    req.url = forwardedPath;
  }
  next();
});
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed API endpoint (useful for tests or resets)
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.status(200).json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Seeding failed', error: error.message });
  }
});

// Mount Routes matching ScheduleController specification
app.use('/api/trainers', trainerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/sessions', sessionRoutes);

// Direct mount fallback for serverless path rewrites
app.use('/trainers', trainerRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/sessions', sessionRoutes);

// Production Static Serving
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('TrainDesk Backend API is running. Build frontend or run Vite dev server.');
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Check if MongoDB is connected and seeding is needed
    if (Trainer.db?.readyState === 1) {
      const trainerCount = await Trainer.countDocuments();
      if (trainerCount === 0) {
        console.log('[Server] No trainers found in DB. Auto-seeding initial prototype dataset...');
        await seedDatabase();
      }
    }

    app.listen(PORT, () => {
      console.log(`[TrainDesk] Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

// Start Server only when not in serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;

