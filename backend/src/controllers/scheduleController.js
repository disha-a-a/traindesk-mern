import mongoose from 'mongoose';
import { Trainer, TrainingSession, Booking } from '../models/index.js';
import { DailySummaryGenerator } from '../services/summaryGenerators.js';
import { timeToMinutes, checkOverlaps } from '../utils/scheduleUtils.js';

/**
 * Helper to resolve Trainer Document
 */
const resolveTrainer = async (trainerId) => {
  if (!trainerId) return null;
  if (mongoose.Types.ObjectId.isValid(trainerId)) {
    const byId = await Trainer.findById(trainerId);
    if (byId) return byId;
  }
  return await Trainer.findOne({ trainerId });
};

/**
 * GET /api/schedules/dashboard
 * Query params: trainerId, date, dayOffset
 */
export const getDashboardSchedule = async (req, res) => {
  try {
    const { trainerId, date, dayOffset } = req.query;

    const trainer = await resolveTrainer(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with identifier "${trainerId}" not found`,
      });
    }

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    let offset = 0;
    let targetDate = new Date(baseDate);

    if (dayOffset !== undefined && dayOffset !== null && !isNaN(Number(dayOffset))) {
      offset = Number(dayOffset);
      targetDate.setDate(targetDate.getDate() + offset);
    } else if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - baseDate.getTime();
        offset = Math.round(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Fetch sessions for this trainer on the target date
    const sessions = await TrainingSession.find({
      trainerId: trainer._id,
      date: { $gte: targetDate, $lt: nextDay },
    })
      .populate({
        path: 'bookings',
        populate: {
          path: 'traineeId',
          select: 'name email phone organization traineeId',
        },
      })
      .lean();

    // Map confirmed, waitlisted, and cancelled counts onto sessions
    const enrichedSessions = sessions.map((s) => {
      const bookings = s.bookings || [];
      const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
      const waitlisted = bookings.filter((b) => b.status === 'WAITLISTED');
      const cancelled = bookings.filter((b) => b.status === 'CANCELLED');

      return {
        ...s,
        confirmedCount: confirmed.length,
        waitlistedCount: waitlisted.length,
        cancelledCount: cancelled.length,
        seatsRemaining: Math.max(0, s.capacity - confirmed.length),
        isFull: confirmed.length >= s.capacity,
      };
    });

    // Generate daily summary briefing
    const brief = DailySummaryGenerator.generate({
      sessions: enrichedSessions,
      date: targetDate,
      dayOffset: offset,
      trainer,
    });

    // 7-day strip data for the week strip navigation
    const weekStrip = [];
    for (let o = 0; o < 7; o++) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(dayDate.getDate() + o);
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(nextDayDate.getDate() + 1);

      const daySessionsCount = await TrainingSession.countDocuments({
        trainerId: trainer._id,
        date: { $gte: dayDate, $lt: nextDayDate },
      });

      weekStrip.push({
        dayOffset: o,
        date: dayDate,
        dayName: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: dayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sessionCount: daySessionsCount,
      });
    }

    return res.status(200).json({
      success: true,
      trainer: {
        id: trainer.trainerId,
        _id: trainer._id,
        name: trainer.name,
        specialization: trainer.specialization,
        email: trainer.email,
      },
      selectedDate: targetDate,
      dayOffset: offset,
      brief,
      weekStrip,
      sessions: enrichedSessions,
    });
  } catch (error) {
    console.error('Error fetching dashboard schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard schedule',
      error: error.message,
    });
  }
};

/**
 * GET /api/schedules/heatmap
 * Query params: trainerId, startDate, endDate
 */
export const getHeatmapSchedule = async (req, res) => {
  try {
    const { trainerId } = req.query;

    const trainer = await resolveTrainer(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with identifier "${trainerId}" not found`,
      });
    }

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    // Fetch all sessions in the 7-day range for this trainer
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 7);

    const allSessions = await TrainingSession.find({
      trainerId: trainer._id,
      date: { $gte: baseDate, $lt: endDate },
    })
      .populate('bookings')
      .lean();

    const daysMatrix = [];

    for (let off = 0; off < 7; off++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + off);
      const dStr = d.toISOString().slice(0, 10);

      const daySessions = allSessions.filter(
        (s) => new Date(s.date).toISOString().slice(0, 10) === dStr
      );

      const overlaps = checkOverlaps(daySessions);

      const dayLabel =
        off === 0
          ? 'Today'
          : off === 1
          ? 'Tomorrow'
          : `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;

      const hourCells = hours.map((hour) => {
        const slotStart = hour * 60;
        const slotEnd = slotStart + 60;

        // Trainees in session during this hour
        const activeSessions = daySessions.filter((s) => {
          const sStart = timeToMinutes(s.startTime);
          const sEnd = timeToMinutes(s.endTime);
          return sStart < slotEnd && sEnd > slotStart;
        });

        const traineeCount = activeSessions.reduce((total, s) => {
          const confirmed =
            s.bookings?.filter((b) => b.status === 'CONFIRMED').length ?? 0;
          return total + confirmed;
        }, 0);

        const hasClash = overlaps.some(
          (o) => o.from < slotEnd && o.to > slotStart
        );

        let level = '';
        if (traineeCount >= 18) level = 'l3';
        else if (traineeCount >= 9) level = 'l2';
        else if (traineeCount > 0) level = 'l1';

        return {
          hour,
          hourFormatted: `${hour}:00`,
          traineeCount,
          level,
          hasClash,
        };
      });

      daysMatrix.push({
        dayOffset: off,
        date: d,
        dayLabel,
        cells: hourCells,
      });
    }

    return res.status(200).json({
      success: true,
      trainerId: trainer.trainerId,
      hours: hours.map((h) => `${h}:00`),
      matrix: daysMatrix,
    });
  } catch (error) {
    console.error('Error fetching heatmap schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch heatmap schedule',
      error: error.message,
    });
  }
};

