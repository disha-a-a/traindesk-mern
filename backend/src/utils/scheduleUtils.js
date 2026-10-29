/**
 * Convert HH:MM time string to minutes from start of day
 * @param {string} timeStr - e.g. "10:30"
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert minutes from start of day to HH:MM format
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToTime(minutes) {
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${String(h).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

/**
 * Format duration in minutes into a human-readable string (e.g. "1h 30m", "2h", "45m")
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  if (h && r) return `${h}h ${r}m`;
  if (h) return `${h}h`;
  return `${r}m`;
}

/**
 * Detect time clashes / overlaps across concurrent sessions for a day
 * @param {Array} sessions
 * @returns {Array<{ x: Object, y: Object, from: number, to: number, fromStr: string, toStr: string }>}
 */
export function checkOverlaps(sessions = []) {
  const sorted = [...sessions].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const overlaps = [];

  for (let i = 0; i < sorted.length; i++) {
    const s1Start = timeToMinutes(sorted[i].startTime);
    const s1End = timeToMinutes(sorted[i].endTime);

    for (let j = i + 1; j < sorted.length; j++) {
      const s2Start = timeToMinutes(sorted[j].startTime);
      const s2End = timeToMinutes(sorted[j].endTime);

      const overlapStart = Math.max(s1Start, s2Start);
      const overlapEnd = Math.min(s1End, s2End);

      if (overlapStart < overlapEnd) {
        overlaps.push({
          x: sorted[i],
          y: sorted[j],
          from: overlapStart,
          to: overlapEnd,
          fromStr: minutesToTime(overlapStart),
          toStr: minutesToTime(overlapEnd),
        });
      }
    }
  }

  return overlaps;
}

/**
 * Computes free windows between sessions (minimum 30 minutes)
 * @param {Array} sessions
 * @returns {Array<{ from: number, to: number, fromStr: string, toStr: string, durationStr: string }>}
 */
export function calculateGaps(sessions = []) {
  const sorted = [...sessions].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const gaps = [];
  let currentEnd = null;

  for (const session of sorted) {
    const start = timeToMinutes(session.startTime);
    const end = timeToMinutes(session.endTime);

    if (currentEnd !== null && start - currentEnd >= 30) {
      gaps.push({
        from: currentEnd,
        to: start,
        fromStr: minutesToTime(currentEnd),
        toStr: minutesToTime(start),
        durationStr: formatDuration(start - currentEnd),
      });
    }

    currentEnd = currentEnd === null ? end : Math.max(currentEnd, end);
  }

  return gaps;
}

