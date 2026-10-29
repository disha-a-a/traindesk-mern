import mongoose from 'mongoose';
import { TrainingSession } from '../models/index.js';
import { DetailedSummaryGenerator } from '../services/summaryGenerators.js';
import InMemoryStore from '../services/inMemoryStore.js';

/**
 * GET /api/sessions/:sessionId/attendees
 * Fetches the detailed trainee roster table for a specific session
 */
export const getSessionAttendees = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (mongoose.connection.readyState === 1) {
      let session = null;
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        session = await TrainingSession.findById(sessionId).populate({
          path: 'bookings',
          populate: {
            path: 'traineeId',
            select: 'name email phone organization traineeId',
          },
        });
      }

      if (!session) {
        session = await TrainingSession.findOne({ sessionId }).populate({
          path: 'bookings',
          populate: {
            path: 'traineeId',
            select: 'name email phone organization traineeId',
          },
        });
      }

      if (session) {
        const roster = DetailedSummaryGenerator.compileSessionRoster(session);
        return res.status(200).json({
          success: true,
          data: roster,
        });
      }
    }

    // Standalone In-Memory fallback mode (no DB required)
    const roster = InMemoryStore.getSessionAttendees(sessionId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: `Session "${sessionId}" not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: roster,
    });
  } catch (error) {
    console.error('Error fetching session attendees, falling back to in-memory store:', error.message);
    const roster = InMemoryStore.getSessionAttendees(req.params.sessionId);
    if (roster) {
      return res.status(200).json({
        success: true,
        data: roster,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch session attendees',
      error: error.message,
    });
  }
};
