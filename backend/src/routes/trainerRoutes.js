import express from 'express';
import { getTrainers } from '../controllers/trainerController.js';

const router = express.Router();

// GET /api/trainers
router.get('/', getTrainers);

export default router;

