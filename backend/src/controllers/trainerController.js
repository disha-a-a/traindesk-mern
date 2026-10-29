import { Trainer } from '../models/index.js';

/**
 * GET /api/trainers
 * Fetches all registered trainers
 */
export const getTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ trainerId: 1 }).lean();
    return res.status(200).json({
      success: true,
      count: trainers.length,
      data: trainers,
    });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trainers',
      error: error.message,
    });
  }
};

