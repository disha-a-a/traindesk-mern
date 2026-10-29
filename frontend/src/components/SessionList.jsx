import React from 'react';
import SessionCard from './SessionCard.jsx';
import { timeToMinutes } from '../utils/timeHelpers.js';

export default function SessionList({ sessions = [], selectedDate }) {
  const dateObj = selectedDate ? new Date(selectedDate) : new Date();
  const dateLabel = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  // Check overlaps among sessions for clash indicator
  const clashesMap = new Set();
  const sorted = [...sessions].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (let i = 0; i < sorted.length; i++) {
    const s1Start = timeToMinutes(sorted[i].startTime);
    const s1End = timeToMinutes(sorted[i].endTime);

    for (let j = i + 1; j < sorted.length; j++) {
      const s2Start = timeToMinutes(sorted[j].startTime);
      const s2End = timeToMinutes(sorted[j].endTime);

      if (Math.max(s1Start, s2Start) < Math.min(s1End, s2End)) {
        clashesMap.add(sorted[i].sessionId || sorted[i]._id);
        clashesMap.add(sorted[j].sessionId || sorted[j]._id);
      }
    }
  }

  return (
    <section>
      <p className="eyebrow">Sessions · {dateLabel}</p>

      <div className="list">
        {sessions.length === 0 ? (
          <div className="panel empty">
            No sessions scheduled. Pick another day to see bookings.
          </div>
        ) : (
          sessions.map((session) => {
            const id = session.sessionId || session._id;
            const hasClash = clashesMap.has(id);
            return (
              <SessionCard
                key={id}
                session={session}
                hasClash={hasClash}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

