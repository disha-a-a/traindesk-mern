import express from 'express';
import {
  getDashboardSchedule,
  getHeatmapSchedule,
} from '../controllers/scheduleController.js';

const router = express.Router();

// GET /api/schedules/dashboard?trainerId={id}&date={date}&dayOffset={offset}
router.get('/dashboard', getDashboardSchedule);

// GET /api/schedules/heatmap?trainerId={id}&startDate={start}&endDate={end}
router.get('/heatmap', getHeatmapSchedule);

export default router;

