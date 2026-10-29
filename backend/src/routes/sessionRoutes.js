import express from 'express';
import { getSessionAttendees } from '../controllers/sessionController.js';

const router = express.Router();

// GET /api/sessions/:sessionId/attendees
router.get('/:sessionId/attendees', getSessionAttendees);

export default router;

