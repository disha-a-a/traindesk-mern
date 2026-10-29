import app from '../backend/server.js';
import connectDB from '../backend/src/config/db.js';
import { Trainer } from '../backend/src/models/index.js';
import { seedDatabase } from '../backend/src/seed.js';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    try {
      await connectDB();
      if (Trainer.db?.readyState === 1) {
        const count = await Trainer.countDocuments();
        if (count === 0) {
          await seedDatabase();
        }
      }
      initialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB init check:', err.message);
    }
  }
  return app(req, res);
}

