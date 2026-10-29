import assert from 'assert';
import {
  timeToMinutes,
  minutesToTime,
  formatDuration,
  checkOverlaps,
  calculateGaps,
} from './src/utils/scheduleUtils.js';
import { DailySummaryGenerator, DetailedSummaryGenerator } from './src/services/summaryGenerators.js';

console.log('--- Testing scheduleUtils ---');

// 1. time conversions
assert.strictEqual(timeToMinutes('10:00'), 600);
assert.strictEqual(timeToMinutes('13:30'), 810);
assert.strictEqual(minutesToTime(600), '10:00');
assert.strictEqual(minutesToTime(810), '13:30');
assert.strictEqual(formatDuration(90), '1h 30m');
assert.strictEqual(formatDuration(120), '2h');
assert.strictEqual(formatDuration(45), '45m');
console.log('✓ Time conversion tests passed');

// 2. checkOverlaps
const mockSessions = [
  { sessionId: 's1', topic: 'Session A', startTime: '10:00', endTime: '12:00' },
  { sessionId: 's2', topic: 'Session B', startTime: '11:00', endTime: '13:00' },
  { sessionId: 's3', topic: 'Session C', startTime: '14:00', endTime: '15:00' },
];

const overlaps = checkOverlaps(mockSessions);
assert.strictEqual(overlaps.length, 1);
assert.strictEqual(overlaps[0].fromStr, '11:00');
assert.strictEqual(overlaps[0].toStr, '12:00');
console.log('✓ checkOverlaps test passed');

// 3. calculateGaps (min 30 min)
const nonOverlapping = [
  { sessionId: 's1', topic: 'Session 1', startTime: '10:00', endTime: '11:00' },
  { sessionId: 's2', topic: 'Session 2', startTime: '12:00', endTime: '13:30' },
  { sessionId: 's3', topic: 'Session 3', startTime: '13:45', endTime: '15:00' }, // 15 min gap, should be ignored
  { sessionId: 's4', topic: 'Session 4', startTime: '16:00', endTime: '17:00' }, // 60 min gap
];
const gaps = calculateGaps(nonOverlapping);
assert.strictEqual(gaps.length, 2);
assert.strictEqual(gaps[0].fromStr, '11:00');
assert.strictEqual(gaps[0].toStr, '12:00');
assert.strictEqual(gaps[0].durationStr, '1h');
assert.strictEqual(gaps[1].fromStr, '15:00');
assert.strictEqual(gaps[1].toStr, '16:00');
console.log('✓ calculateGaps test passed');

// 4. DailySummaryGenerator
const brief = DailySummaryGenerator.generate({
  sessions: [
    {
      sessionId: 's1',
      topic: 'Java Basics',
      startTime: '10:00',
      endTime: '12:00',
      room: 'Lab 2',
      capacity: 20,
      confirmedCount: 12,
      waitlistedCount: 0,
    },
    {
      sessionId: 's2',
      topic: 'Doubt Clearing',
      startTime: '13:30',
      endTime: '14:30',
      room: 'Room 5',
      capacity: 8,
      confirmedCount: 4,
      waitlistedCount: 0,
    },
  ],
  date: new Date(),
  dayOffset: 0,
});

assert.ok(brief.statementHeading.includes('sessions'));
assert.strictEqual(brief.stats.find((s) => s.label === 'Sessions').value, 2);
assert.strictEqual(brief.stats.find((s) => s.label === 'Trainees booked').value, 16);
assert.strictEqual(brief.timeline.blocks.length, 2);
console.log('✓ DailySummaryGenerator test passed');

// 5. DetailedSummaryGenerator
const roster = DetailedSummaryGenerator.compileSessionRoster({
  sessionId: 's1',
  topic: 'Java Basics',
  capacity: 20,
  bookings: [
    {
      bookingId: 'bk-1',
      status: 'CONFIRMED',
      traineeId: { name: 'Aarav Mehta', organization: 'RIT Bengaluru', email: 'aarav@rit.com' },
      bookedAt: new Date(),
    },
    {
      bookingId: 'bk-2',
      status: 'WAITLISTED',
      traineeId: { name: 'Sneha Patil', organization: 'Infosys', email: 'sneha@infosys.com' },
      bookedAt: new Date(),
    },
  ],
});
assert.strictEqual(roster.confirmedCount, 1);
assert.strictEqual(roster.waitlistedCount, 1);
assert.strictEqual(roster.seatsRemaining, 19);
assert.strictEqual(roster.attendees.length, 2);
console.log('✓ DetailedSummaryGenerator test passed');

console.log('ALL UNIT TESTS PASSED SUCCESSFULLY! 🎉');

