import {
  timeToMinutes,
  minutesToTime,
  formatDuration,
  checkOverlaps,
  calculateGaps,
} from '../utils/scheduleUtils.js';

export class DailySummaryGenerator {
  /**
   * Builds the daily briefing dashboard data
   * @param {Object} options
   * @param {Array} options.sessions - List of sessions for the day (with bookings populated or counted)
   * @param {Date} options.date - The date object for the day
   * @param {number} options.dayOffset - Relative day offset (0 = today, 1 = tomorrow, etc.)
   * @param {Object} options.trainer - Trainer info
   */
  static generate({ sessions = [], date = new Date(), dayOffset = 0, trainer = null }) {
    const sorted = [...sessions].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const overlaps = checkOverlaps(sorted);
    const gaps = calculateGaps(sorted);

    const isToday = dayOffset === 0;
    const isTomorrow = dayOffset === 1;

    const weekdayLong = date.toLocaleDateString('en-US', { weekday: 'long' });
    const phrase = isToday ? 'today' : isTomorrow ? 'tomorrow' : `on ${weekdayLong}`;
    const capitalizedPhrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);

    const firstStart = sorted.length > 0 ? sorted[0].startTime : null;
    const lastEnd =
      sorted.length > 0
        ? minutesToTime(Math.max(...sorted.map((s) => timeToMinutes(s.endTime))))
        : null;

    // Statement heading
    let statementHeading = '';
    if (!sorted.length) {
      statementHeading = `You have no sessions ${phrase}.`;
    } else if (sorted.length === 1) {
      statementHeading = `${capitalizedPhrase} you have 1 session, from ${firstStart} to ${lastEnd}.`;
    } else {
      statementHeading = `${capitalizedPhrase} you have ${sorted.length} sessions, starting at ${firstStart} and finishing at ${lastEnd}.`;
    }

    // Natural language lead
    let leadText = '';
    if (!sorted.length) {
      leadText = `You have no sessions ${phrase}. The whole day is free.`;
    } else {
      const items = sorted.map((s) => {
        const confCount = s.confirmedCount ?? s.bookings?.filter((b) => b.status === 'CONFIRMED').length ?? 0;
        return `${s.topic} at ${s.startTime} (${confCount} trainee${confCount === 1 ? '' : 's'})`;
      });

      const joinedList =
        items.length < 2
          ? items.join('')
          : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];

      leadText = `${capitalizedPhrase} you have ${sorted.length} session${sorted.length > 1 ? 's' : ''}: ${joinedList}. `;
      leadText +=
        sorted.length === 1
          ? `It runs from ${sorted[0].startTime} to ${sorted[0].endTime}.`
          : `Your first session starts at ${firstStart} and your last one ends at ${lastEnd}.`;
    }

    // Total confirmed trainees
    const totalTrainees = sorted.reduce((sum, s) => {
      const conf = s.confirmedCount ?? s.bookings?.filter((b) => b.status === 'CONFIRMED').length ?? 0;
      return sum + conf;
    }, 0);

    // bstats (Statistic Counters)
    const stats = sorted.length
      ? [
          { label: 'Sessions', value: sorted.length },
          { label: 'Trainees booked', value: totalTrainees },
          { label: 'First start', value: firstStart },
          { label: 'Last end', value: lastEnd },
          {
            label: 'Clashes',
            value: overlaps.length,
            variant: overlaps.length > 0 ? 'bad' : 'normal',
          },
        ]
      : [
          { label: 'Sessions', value: 0 },
          { label: 'Free', value: 'All day' },
        ];

    // Timeline calculations: 08:00 (480 mins) to 18:00 (1080 mins)
    const T0 = 480;
    const T1 = 1080;
    const span = T1 - T0;

    const lanes = [];
    const laneOf = new Map();
    sorted.forEach((s) => {
      const startM = timeToMinutes(s.startTime);
      const endM = timeToMinutes(s.endTime);
      let laneIndex = 0;
      while (lanes[laneIndex] !== undefined && lanes[laneIndex] > startM) {
        laneIndex++;
      }
      lanes[laneIndex] = endM;
      laneOf.set(s._id ? s._id.toString() : s.sessionId, laneIndex);
    });

    const laneCount = Math.max(1, lanes.length);
    const containerHeight = laneCount === 1 ? 44 : 76;
    const blockHeight = (containerHeight - 8 - (laneCount - 1) * 4) / laneCount;

    const timelineBlocks = sorted.map((s) => {
      const key = s._id ? s._id.toString() : s.sessionId;
      const l = laneOf.get(key) || 0;
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);

      const leftPercent = Math.max(0, ((sStart - T0) / span) * 100);
      const widthPercent =
        ((Math.min(sEnd, T1) - Math.max(sStart, T0)) / span) * 100;
      const topPx = 4 + l * (blockHeight + 4);

      const hasClash = overlaps.some(
        (o) =>
          (o.x._id && o.x._id.toString() === key) ||
          (o.y._id && o.y._id.toString() === key) ||
          o.x.sessionId === s.sessionId ||
          o.y.sessionId === s.sessionId
      );

      return {
        sessionId: s.sessionId,
        topic: s.topic,
        startTime: s.startTime,
        endTime: s.endTime,
        leftPercent,
        widthPercent,
        topPx,
        blockHeight,
        hasClash,
        title: `${s.topic} ${s.startTime} to ${s.endTime}`,
      };
    });

    const timelineTicks = [
      { minute: 480, label: '08:00', percent: 0 },
      { minute: 600, label: '10:00', percent: 20 },
      { minute: 720, label: '12:00', percent: 40 },
      { minute: 840, label: '14:00', percent: 60 },
      { minute: 960, label: '16:00', percent: 80 },
      { minute: 1080, label: '18:00', percent: 100 },
    ];

    // Current time status for agenda
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextUpSessionId = null;
    if (isToday) {
      const upcoming = sorted.find((s) => timeToMinutes(s.startTime) > currentMinutes);
      if (upcoming) {
        nextUpSessionId = upcoming.sessionId;
      }
    }

    // Agenda items with pills
    const agendaItems = sorted.map((s) => {
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);
      const key = s._id ? s._id.toString() : s.sessionId;
      const confCount = s.confirmedCount ?? s.bookings?.filter((b) => b.status === 'CONFIRMED').length ?? 0;
      const waitCount = s.waitlistedCount ?? s.bookings?.filter((b) => b.status === 'WAITLISTED').length ?? 0;

      const hasClash = overlaps.some(
        (o) =>
          (o.x._id && o.x._id.toString() === key) ||
          (o.y._id && o.y._id.toString() === key) ||
          o.x.sessionId === s.sessionId ||
          o.y.sessionId === s.sessionId
      );

      const isLive = isToday && sStart <= currentMinutes && currentMinutes < sEnd;
      const isNext = s.sessionId === nextUpSessionId;
      const isFull = confCount >= s.capacity;

      const pills = [];
      if (isLive) pills.push({ variant: 'ok', text: 'In progress' });
      if (isNext) pills.push({ variant: 'ok', text: 'Next up' });
      if (isFull) pills.push({ variant: 'warn', text: 'Full' });
      if (waitCount > 0) pills.push({ variant: '', text: `${waitCount} waitlisted` });
      if (hasClash) pills.push({ variant: 'bad', text: 'Clash' });

      return {
        sessionId: s.sessionId,
        topic: s.topic,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        confirmedCount: confCount,
        capacity: s.capacity,
        pills,
      };
    });

    // Warning & Free Chips
    const chips = [];
    gaps.forEach((g) => {
      chips.push({
        text: `Free ${g.fromStr} – ${g.toStr} · ${g.durationStr}`,
        variant: 'normal',
      });
    });

    overlaps.forEach((o) => {
      chips.push({
        text: `Clash: ${o.x.topic} and ${o.y.topic} overlap ${o.fromStr} – ${o.toStr}`,
        variant: 'bad',
      });
    });

    if (isToday && sorted.length && !nextUpSessionId && !sorted.some((s) => timeToMinutes(s.startTime) <= currentMinutes && currentMinutes < timeToMinutes(s.endTime))) {
      chips.push({
        text: 'All of today’s sessions are over',
        variant: 'normal',
      });
    }

    if (!sorted.length) {
      chips.push({
        text: 'The whole day is free',
        variant: 'normal',
      });
    }

    return {
      dateFormatted: `Summary · ${date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}`,
      statementHeading,
      leadText,
      stats,
      timeline: {
        containerHeight,
        blocks: timelineBlocks,
        ticks: timelineTicks,
      },
      agenda: agendaItems,
      chips,
      clashesCount: overlaps.length,
    };
  }
}

export class DetailedSummaryGenerator {
  /**
   * Compiles detailed roster tables and booking lists for sessions
   * @param {Object} session - The session document with bookings and trainee data populated
   */
  static compileSessionRoster(session) {
    if (!session) return null;

    const bookings = session.bookings || [];

    const formattedAttendees = bookings.map((b, idx) => {
      const traineeName = b.traineeId?.name || b.traineeName || `Trainee #${idx + 1}`;
      const organization = b.traineeId?.organization || b.organization || 'Independent';
      const bookedAtFormatted = b.bookedAt
        ? new Date(b.bookedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : 'N/A';

      return {
        bookingId: b.bookingId || `b-${idx}`,
        name: traineeName,
        email: b.traineeId?.email || '',
        organization,
        bookedAt: bookedAtFormatted,
        status: b.status || 'CONFIRMED',
        notes: b.notes || '',
      };
    });

    const confirmedCount = formattedAttendees.filter((a) => a.status === 'CONFIRMED').length;
    const waitlistedCount = formattedAttendees.filter((a) => a.status === 'WAITLISTED').length;
    const cancelledCount = formattedAttendees.filter((a) => a.status === 'CANCELLED').length;
    const seatsRemaining = Math.max(0, session.capacity - confirmedCount);

    return {
      sessionId: session.sessionId,
      topic: session.topic,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      room: session.room,
      capacity: session.capacity,
      confirmedCount,
      waitlistedCount,
      cancelledCount,
      seatsRemaining,
      isFull: seatsRemaining <= 0,
      attendees: formattedAttendees,
    };
  }
}
