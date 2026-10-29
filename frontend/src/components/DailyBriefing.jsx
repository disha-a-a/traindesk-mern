import React from 'react';

export default function DailyBriefing({ brief }) {
  if (!brief) return null;

  const {
    dateFormatted,
    statementHeading,
    stats = [],
    timeline = { containerHeight: 44, blocks: [], ticks: [] },
    agenda = [],
    chips = [],
  } = brief;

  return (
    <section className="panel brief" aria-live="polite">
      <p className="eyebrow">{dateFormatted}</p>
      <p className="bhead">{statementHeading}</p>

      {/* Stats Counter Row */}
      <div className="bstats">
        {stats.map((st, i) => (
          <div
            key={i}
            className={`bs ${st.variant === 'bad' ? 'bad' : ''}`}
          >
            <b>{st.value}</b>
            <span>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Interactive Timeline Bar */}
      <div className="tl">
        <div
          className="tlbar"
          style={{ height: `${timeline.containerHeight}px` }}
        >
          {/* Vertical Grid Lines at 10:00 (20%), 12:00 (40%), 14:00 (60%), 16:00 (80%) */}
          <i className="gl" style={{ left: '20%' }} />
          <i className="gl" style={{ left: '40%' }} />
          <i className="gl" style={{ left: '60%' }} />
          <i className="gl" style={{ left: '80%' }} />

          {/* Time Blocks */}
          {timeline.blocks.map((blk) => (
            <div
              key={blk.sessionId}
              className={`blk ${blk.hasClash ? 'clash' : ''}`}
              style={{
                left: `${blk.leftPercent}%`,
                width: `${blk.widthPercent}%`,
                top: `${blk.topPx}px`,
                height: `${blk.blockHeight}px`,
              }}
              title={blk.title}
            >
              {blk.topic}
            </div>
          ))}
        </div>

        {/* Timeline Axis Ticks */}
        <div className="tlax">
          {timeline.ticks.map((t, idx) => {
            const transform =
              idx === 0
                ? 'none'
                : idx === timeline.ticks.length - 1
                ? 'translateX(-100%)'
                : 'translateX(-50%)';

            return (
              <span
                key={t.minute}
                style={{
                  left: `${t.percent}%`,
                  transform,
                }}
              >
                {t.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Agenda List */}
      {agenda.length > 0 && (
        <ul className="agenda">
          {agenda.map((item) => (
            <li key={item.sessionId} className="ag">
              <span className="agt">
                {item.startTime} – {item.endTime}
              </span>
              <div className="agm">
                <b>{item.topic}</b>
                <span>
                  {item.confirmedCount} trainee{item.confirmedCount === 1 ? '' : 's'} · {item.room}
                </span>
              </div>
              <div className="agp">
                {item.pills.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className={`pill ${p.variant}`}
                  >
                    {p.text}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Chips */}
      {chips.length > 0 && (
        <div className="chips">
          {chips.map((c, cIdx) => (
            <span
              key={cIdx}
              className={`chip ${c.variant === 'bad' ? 'bad' : ''}`}
            >
              {c.text}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

