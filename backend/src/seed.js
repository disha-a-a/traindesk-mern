import mongoose from 'mongoose';
import connectDB, { disconnectDB } from './config/db.js';
import { Person, Trainer, Trainee, TrainingSession, Booking } from './models/index.js';

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
    name: 'Priya Raman',
    specialization: 'Java, Spring Boot, REST APIs',
    email: 'priya.raman@traindesk.io',
    phone: '+91 98765 43210'
  },
  {
    trainerId: 't2',
    name: 'Karthik Subramanian',
    specialization: 'React, TypeScript, CSS',
    email: 'karthik.s@traindesk.io',
    phone: '+91 98765 43211'
  },
  {
    trainerId: 't3',
    name: 'Neha Kulkarni',
    specialization: 'Git, Docker, CI/CD',
    email: 'neha.k@traindesk.io',
    phone: '+91 98765 43212'
  }
];

// [trainerId, dayOffset, topic, start, end, room, capacity, confirmed, waitlisted, cancelled]
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

export const seedDatabase = async () => {
  console.log('[Seeder] Starting database seeding...');

  // Clear existing collections
  await Booking.deleteMany({});
  await TrainingSession.deleteMany({});
  await Person.deleteMany({});

  console.log('[Seeder] Cleared existing data.');

  // 1. Seed Trainers
  const trainerDocs = await Trainer.insertMany(TRAINERS_DATA);
  const trainerMap = new Map();
  trainerDocs.forEach((t) => trainerMap.set(t.trainerId, t._id));
  console.log(`[Seeder] Seeded ${trainerDocs.length} trainers.`);

  // 2. Seed Trainees
  const traineeDocsData = POOL.map((name, idx) => {
    const org = ORGS[idx % ORGS.length];
    const username = name.toLowerCase().replace(/\s+/g, '.');
    return {
      name,
      email: `${username}@${org.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+91 ${9800000000 + idx * 11111}`,
      traineeId: `tr-${idx + 1}`,
      organization: org,
    };
  });
  const traineeDocs = await Trainee.insertMany(traineeDocsData);
  console.log(`[Seeder] Seeded ${traineeDocs.length} trainees.`);

  // 3. Seed Sessions & Bookings
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const sessionsToInsert = [];
  const bookingsToInsert = [];

  for (let i = 0; i < RAW_SESSIONS.length; i++) {
    const [tId, off, topic, sTime, eTime, room, cap, conf, wait, canc] = RAW_SESSIONS[i];
    const trainerObjectId = trainerMap.get(tId);

    const sessionDate = new Date(baseDate);
    sessionDate.setDate(sessionDate.getDate() + off);

    const sessionMongoId = new mongoose.Types.ObjectId();
    const sessionId = `s${i}`;

    sessionsToInsert.push({
      _id: sessionMongoId,
      sessionId,
      trainerId: trainerObjectId,
      topic,
      date: sessionDate,
      startTime: sTime,
      endTime: eTime,
      room,
      capacity: cap,
    });

    // Generate Bookings for this session matching prototype pattern
    let k = 0;
    const addStatusBookings = (count, status) => {
      for (let j = 0; j < count; j++, k++) {
        const traineeIndex = (i * 7 + k) % traineeDocs.length;
        const trainee = traineeDocs[traineeIndex];

        // Booked timestamp: prior days
        const bookingDate = new Date(baseDate);
        bookingDate.setDate(bookingDate.getDate() + off - ((k % 5) + 1));
        bookingDate.setHours(9 + ((k * 3) % 9), (k * 17) % 60, 0, 0);

        bookingsToInsert.push({
          bookingId: `bk-${i}-${k}`,
          sessionId: sessionMongoId,
          traineeId: trainee._id,
          bookedAt: bookingDate,
          status,
          notes: status === 'WAITLISTED' ? 'Pending seat release' : undefined,
        });
      }
    };

    addStatusBookings(conf, 'CONFIRMED');
    addStatusBookings(wait, 'WAITLISTED');
    addStatusBookings(canc, 'CANCELLED');
  }

  const insertedSessions = await TrainingSession.insertMany(sessionsToInsert);
  console.log(`[Seeder] Seeded ${insertedSessions.length} training sessions.`);

  const insertedBookings = await Booking.insertMany(bookingsToInsert);
  console.log(`[Seeder] Seeded ${insertedBookings.length} bookings.`);

  console.log('[Seeder] Database seeding completed successfully!');
};

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seeder] Error during seeding:', err);
      process.exit(1);
    }
  })();
}

