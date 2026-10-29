import {
  timeToMinutes,
  minutesToTime,
  formatDuration,
  checkOverlaps,
  calculateGaps,
} from '../utils/scheduleUtils.js';
import { DailySummaryGenerator, DetailedSummaryGenerator } from './summaryGenerators.js';

export const POOL = [
  'Aarav Mehta', 'Ananya Rao', 'Rohit Sharma', 'Kavya Nair', 'Vikram Singh',
  'Sneha Patil', 'Arjun Reddy', 'Isha Gupta', 'Karthik Iyer', 'Meera Joshi',
  'Rahul Verma', 'Divya Menon', 'Aditya Kulkarni', 'Pooja Shetty', 'Siddharth Das',
  'Nisha Bhat', 'Manish Kumar', 'Riya Kapoor', 'Varun Hegde', 'Tanvi Desai',
  'Harsh Agarwal', 'Lakshmi Prasad', 'Deepak Naik', 'Shreya Banerjee', 'Yash Malhotra',
  'Anjali Pillai', 'Sanjay Gowda', 'Preeti Jain', 'Naveen Raj', 'Swati Bhandari'
];

export const ORGS = [
  'RIT Bengaluru', 'Infosys', 'Wipro', 'TCS', 'Freelancer', 'BMS College', 'PES University', 'Accenture'
];

export const TRAINERS_DATA = [
  {
    trainerId: 't1',
    _id: 't1',
    name: 'Priya Raman',
    specialization: 'Java, Spring Boot, REST APIs',
    email: 'priya.raman@traindesk.io',
    phone: '+91 98765 43210'
  },
  {
    trainerId: 't2',
    _id: 't2',
    name: 'Karthik Subramanian',
    specialization: 'React, TypeScript, CSS',
    email: 'karthik.s@traindesk.io',
    phone: '+91 98765 43211'
  },
  {
    trainerId: 't3',
    _id: 't3',
    name: 'Neha Kulkarni',
    specialization: 'Git, Docker, CI/CD',
    email: 'neha.k@traindesk.io',
    phone: '+91 98765 43212'
  }
];

export const RAW_SESSIONS = [
  ['t1', 0, 'Java Basics', '10:00', '12:00', 'Lab 2', 20, 12, 0, 1],
  ['t1', 0, 'Doubt Clearing', '13:30', '14:30', 'Room 5', 8, 4, 0, 0],
  ['t1', 0, 'Spring Boot Workshop', '16:00', '17:30', 'Seminar Hall', 20, 20, 3, 0],
  ['t1', 1, 'OOP Concepts', '09:30', '11:00', 'Lab 2', 25, 18, 0, 2],
  ['t1', 2, 'Collections Deep Dive', '10:00', '12:00', 'Lab 1', 20, 15, 0, 0],
  ['t1', 2, 'REST APIs', '14:00', '16:00', 'Lab 1', 20, 10, 0, 1],
  ['t1', 4, 'Exception Handling', '11:00', '13:00', 'Lab 3', 20, 9, 2, 0],
  ['t1', 5, 'Multithreading', '14:00', '16:00', 'Seminar Hall', 25, 23, 0, 0],
  ['t1', 5, 'Mock Interviews', '15:30', '17:00', 'Room 5', 6, 6, 1, 0],
  ['t1', 6, 'Weekend Doubt Session', '10:00', '12:00', 'Room 5', 15, 7, 0, 0],
  ['t2', 0, 'React Hooks', '11:00', '13:00', 'Lab 4', 20, 14, 0, 0],
  ['t2', 2, 'TypeScript Intro', '10:00', '12:00', 'Lab 4', 20, 16, 0, 1],
  ['t2', 2, 'State Management', '15:00', '17:00', 'Lab 4', 20, 11, 0, 0],
  ['t2', 3, 'React Project Review', '14:00', '15:30', 'Room 2', 12, 8, 0, 0],
  ['t2', 4, 'CSS Layout Lab', '09:00', '11:00', 'Lab 2', 20, 20, 4, 0],
  ['t2', 5, 'Testing React Apps', '13:00', '15:00', 'Lab 4', 20, 12, 0, 0],
  ['t3', 1, 'Git Basics', '10:00', '12:00', 'Lab 3', 25, 22, 2, 0],
  ['t3', 1, 'Branching Strategies', '14:00', '15:30', 'Lab 3', 20, 15, 0, 1],
  ['t3', 2, 'CI Pipelines', '11:00', '13:00', 'Lab 3', 20, 13, 0, 0],
  ['t3', 3, 'Docker Basics', '10:00', '11:30', 'Lab 1', 15, 9, 0, 0],
  ['t3', 3, 'Code Review Practices', '15:00', '17:00', 'Seminar Hall', 25, 17, 0, 0],
  ['t3', 5, 'Deployment Workshop', '10:00', '12:00', 'Lab 3', 20, 18, 0, 0]
];

export class InMemoryStore {
  static getBaseDate() {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }

  static getTrainers() {
    return TRAINERS_DATA;
  }

  static getTrainer(id) {
    return TRAINERS_DATA.find((t) => t.trainerId === id || t._id === id);
  }

  static getAllSessions() {
    const base = this.getBaseDate();

    return RAW_SESSIONS.map((r, i) => {
      const [tid, off, topic, s, e, room, cap, conf, wait, canc] = r;
      const bookings = [];
      let k = 0;

      const addBookings = (count, status) => {
        for (let j = 0; j < count; j++, k++) {
          const d = new Date(base);
          d.setDate(d.getDate() + off - ((k % 5) + 1));
          d.setHours(9 + ((k * 3) % 9), (k * 17) % 60, 0, 0);

          const traineeName = POOL[(i * 7 + k) % POOL.length];
          const traineeOrg = ORGS[(i + k * 3) % ORGS.length];

          bookings.push({
            bookingId: `bk-${i}-${k}`,
            traineeId: {
              name: traineeName,
              organization: traineeOrg,
              email: `${traineeName.toLowerCase().replace(/\s+/g, '.')}@${traineeOrg.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            },
            name: traineeName,
            org: traineeOrg,
            bookedAt: d,
            status,
          });
        }
      };

      addBookings(conf, 'CONFIRMED');
      addBookings(wait, 'WAITLISTED');
      addBookings(canc, 'CANCELLED');

      const sessionDate = new Date(base);
      sessionDate.setDate(sessionDate.getDate() + off);

      return {
        _id: `s${i}`,
        sessionId: `s${i}`,
        trainerId: tid,
        dayOffset: off,
        topic,
        date: sessionDate,
        startTime: s,
        endTime: e,
        room,
        capacity: cap,
        confirmedCount: conf,
        waitlistedCount: wait,
        cancelledCount: canc,
        seatsRemaining: Math.max(0, cap - conf),
        isFull: conf >= cap,
        bookings,
      };
    });
  }

  static getDashboardSchedule(trainerId, dayOffset = 0) {
    const trainer = this.getTrainer(trainerId) || TRAINERS_DATA[0];
    const offset = Number(dayOffset) || 0;

    const all = this.getAllSessions();
    const daySessions = all
      .filter((s) => (s.trainerId === trainer.trainerId || s.trainerId === trainer._id) && s.dayOffset === offset)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const base = this.getBaseDate();
    const targetDate = new Date(base);
    targetDate.setDate(targetDate.getDate() + offset);

    const brief = DailySummaryGenerator.generate({
      sessions: daySessions,
      date: targetDate,
      dayOffset: offset,
      trainer,
    });

    // 7-day strip
    const weekStrip = [];
    for (let o = 0; o < 7; o++) {
      const d = new Date(base);
      d.setDate(d.getDate() + o);
      const count = all.filter(
        (s) => (s.trainerId === trainer.trainerId || s.trainerId === trainer._id) && s.dayOffset === o
      ).length;

      weekStrip.push({
        dayOffset: o,
        date: d,
        dayName: o === 0 ? 'Today' : o === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sessionCount: count,
      });
    }

    return {
      success: true,
      trainer,
      selectedDate: targetDate,
      dayOffset: offset,
      brief,
      weekStrip,
      sessions: daySessions,
    };
  }

  static getHeatmapSchedule(trainerId) {
    const trainer = this.getTrainer(trainerId) || TRAINERS_DATA[0];
    const base = this.getBaseDate();
    const all = this.getAllSessions().filter(
      (s) => s.trainerId === trainer.trainerId || s.trainerId === trainer._id
    );

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const matrix = [];

    for (let off = 0; off < 7; off++) {
      const d = new Date(base);
      d.setDate(d.getDate() + off);

      const daySessions = all.filter((s) => s.dayOffset === off);
      const overlaps = checkOverlaps(daySessions);

      const dayLabel =
        off === 0
          ? 'Today'
          : off === 1
          ? 'Tomorrow'
          : `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;

      const cells = hours.map((hour) => {
        const slotStart = hour * 60;
        const slotEnd = slotStart + 60;

        const activeSessions = daySessions.filter((s) => {
          const sStart = timeToMinutes(s.startTime);
          const sEnd = timeToMinutes(s.endTime);
          return sStart < slotEnd && sEnd > slotStart;
        });

        const traineeCount = activeSessions.reduce((total, s) => total + s.confirmedCount, 0);
        const hasClash = overlaps.some((o) => o.from < slotEnd && o.to > slotStart);

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

      matrix.push({
        dayOffset: off,
        date: d,
        dayLabel,
        cells,
      });
    }

    return {
      success: true,
      trainerId: trainer.trainerId,
      hours: hours.map((h) => `${h}:00`),
      matrix,
    };
  }

  static getSessionAttendees(sessionId) {
    const all = this.getAllSessions();
    const session = all.find((s) => s.sessionId === sessionId || s._id === sessionId);

    if (!session) return null;
    return DetailedSummaryGenerator.compileSessionRoster(session);
  }
}

export default InMemoryStore;

