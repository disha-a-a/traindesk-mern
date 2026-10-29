import React from 'react';

export default function DayStrip({ days = [], selectedDayOffset = 0, onSelectDay }) {
  return (
    <nav className="days" aria-label="Choose a day">
      {days.map((day) => {
        const isSelected = day.dayOffset === selectedDayOffset;
        const countText =
          day.sessionCount > 0
            ? `${day.sessionCount} session${day.sessionCount > 1 ? 's' : ''}`
            : 'Free';

        return (
          <button
            key={day.dayOffset}
            type="button"
            className="day"
            aria-pressed={isSelected}
            onClick={() => onSelectDay(day.dayOffset)}
          >
            <span className="dn">{day.dayName}</span>
            <span className="dd">{day.formattedDate}</span>
            <span className="dc">{countText}</span>
          </button>
        );
      })}
    </nav>
  );
}

