import React, { useState } from 'react';
import { formatDuration, timeToMinutes } from '../utils/timeHelpers.js';
import { fetchSessionAttendees } from '../services/api.js';

export default function SessionCard({ session, hasClash = false }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [attendees, setAttendees] = useState(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const startM = timeToMinutes(session.startTime);
  const endM = timeToMinutes(session.endTime);
  const durationStr = formatDuration(endM - startM);

  const confCount = session.confirmedCount ?? session.bookings?.filter((b) => b.status === 'CONFIRMED').length ?? 0;
  const waitCount = session.waitlistedCount ?? session.bookings?.filter((b) => b.status === 'WAITLISTED').length ?? 0;
  const cap = session.capacity;
  const seatsLeft = Math.max(0, cap - confCount);
  const isFull = seatsLeft <= 0;

  const percentBooked = Math.min(100, Math.round((confCount / cap) * 100));

  const handleToggle = async (e) => {
    const isOpen = e.target.open;
    setDetailsOpen(isOpen);

    if (isOpen && !attendees) {
      try {
        setLoadingAttendees(true);
        const data = await fetchSessionAttendees(session.sessionId || session._id);
        if (data && data.data && data.data.attendees) {
          setAttendees(data.data.attendees);
        }
      } catch (err) {
        console.warn('Could not fetch attendees dynamically, falling back to embedded bookings:', err);
      } finally {
        setLoadingAttendees(false);
      }
    }
  };

  // Trainee list: either dynamically fetched roster or embedded bookings
  const traineeRows = attendees || (session.bookings || []).map((b, i) => {
    const bookedAtDate = b.bookedAt ? new Date(b.bookedAt) : null;
    const bookedAtStr = bookedAtDate
      ? `${bookedAtDate.getDate()} ${bookedAtDate.toLocaleDateString('en-US', {
          month: 'short',
        })}, ${String(bookedAtDate.getHours()).padStart(2, '0')}:${String(
          bookedAtDate.getMinutes()
        ).padStart(2, '0')}`
      : 'N/A';

    return {
      bookingId: b.bookingId || `b-${i}`,
      name: b.traineeId?.name || b.name || `Trainee #${i + 1}`,
      organization: b.traineeId?.organization || b.org || 'Independent',
      bookedAt: bookedAtStr,
      status: b.status,
    };
  });

  return (
    <article className={`sess ${hasClash ? 'clash' : ''}`}>
      <div className="when">
        <span className="a">{session.startTime}</span>
        <span className="b">to {session.endTime}</span>
        <span className="d">{durationStr}</span>
      </div>

      <div className="main">
        <h3>
          {session.topic}
          {isFull ? (
            <span className="pill warn">Full</span>
          ) : (
            <span className="pill ok">
              {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left
            </span>
          )}
          {waitCount > 0 && (
            <span className="pill">{waitCount} waitlisted</span>
          )}
          {hasClash && <span className="pill bad">Clash</span>}
        </h3>

        <p className="meta">
          {session.room} · {confCount} of {cap} booked
        </p>

        <div
          className="bar"
          role="img"
          aria-label={`${confCount} of ${cap} seats booked`}
        >
          <i style={{ width: `${percentBooked}%` }} />
        </div>

        <details onToggle={handleToggle}>
          <summary>View trainees ({traineeRows.length})</summary>
          <div className="tw">
            {loadingAttendees ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.86rem', padding: '8px 0' }}>
                Loading attendees...
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Trainee</th>
                    <th>Organisation</th>
                    <th>Booked on</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {traineeRows.map((t, idx) => {
                    const statusClass =
                      t.status === 'CONFIRMED' || t.status === 'Confirmed'
                        ? 'ok'
                        : t.status === 'WAITLISTED' || t.status === 'Waitlisted'
                        ? 'warn'
                        : '';

                    return (
                      <tr key={t.bookingId || idx}>
                        <td>{t.name}</td>
                        <td>{t.organization}</td>
                        <td className="mono">{t.bookedAt}</td>
                        <td>
                          <span className={`pill ${statusClass}`}>{t.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}
