import React from 'react';

export default function WeekHeatMap({
  heatmapData = { hours: [], matrix: [] },
  selectedDayOffset = 0,
  onSelectDay,
}) {
  const { hours = [], matrix = [] } = heatmapData;

  return (
    <section className="panel">
      <h2>Week by hour</h2>
      <p className="sub">Trainees in session each hour. Click a row to open that day.</p>

      <div className="scroll">
        <div className="heat">
          {/* Header empty cell */}
          <div />

          {/* Hour Headers */}
          {hours.map((h, i) => (
            <div key={i} className="hh">
              {h}
            </div>
          ))}

          {/* Day Rows */}
          {matrix.map((row) => {
            const isRowSelected = row.dayOffset === selectedDayOffset;

            return (
              <React.Fragment key={row.dayOffset}>
                <button
                  type="button"
                  className="rl"
                  aria-pressed={isRowSelected}
                  onClick={() => onSelectDay(row.dayOffset)}
                >
                  {row.dayLabel}
                </button>

                {row.cells.map((cell, cIdx) => {
                  const cellClasses = [
                    'cell',
                    cell.level,
                    cell.hasClash ? 'clash' : '',
                    isRowSelected ? 'sel' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={cIdx}
                      className={cellClasses}
                      title={`${row.dayLabel} at ${cell.hourFormatted}: ${
                        cell.traineeCount
                      } trainees${cell.hasClash ? ' (Clash)' : ''}`}
                    >
                      {cell.traineeCount || ''}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="legend">
        <span>
          <i />
          Free
        </span>
        <span>
          <i style={{ background: 'var(--h1)' }} />1 to 8 trainees
        </span>
        <span>
          <i style={{ background: 'var(--h2)' }} />9 to 17
        </span>
        <span>
          <i style={{ background: 'var(--h3)' }} />18 or more
        </span>
        <span>
          <i style={{ borderColor: 'var(--bad-line)' }} />Overlapping sessions
        </span>
      </div>
    </section>
  );
}

