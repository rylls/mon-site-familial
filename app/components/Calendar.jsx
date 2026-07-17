'use client';
import { useState } from 'react';
import { addBooking, deleteBooking } from '../actions';
import { parseDate, fmtDate, overlaps, formatRange, startOfToday } from '../lib/dates';
import Avatar from './Avatar';
import CommentThread from './CommentThread';

const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

export default function Calendar({ members, bookings, onBookingsChange, comments, onCommentsChange, currentMember }) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState(currentMember?.id || members[0]?.id);

  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const today = startOfToday();

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const rangeStart = start;
  const rangeEnd = end || start;
  const hasConflict = start && bookings.some((b) => overlaps(rangeStart, rangeEnd, parseDate(b.start_date), parseDate(b.end_date)));

  const upcoming = bookings
    .filter((b) => parseDate(b.end_date) >= today)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date));

  function handleDayClick(date) {
    if (date < today) return;
    if (!start) { setStart(date); setEnd(null); return; }
    if (start && !end) {
      if (date < start) { setStart(date); return; }
      setEnd(date);
      return;
    }
    setStart(date); setEnd(null);
  }

  function clearSelection() {
    setStart(null); setEnd(null); setNote('');
  }

  async function handleConfirm() {
    if (!start || !memberId) return;
    const updated = await addBooking({ member_id: memberId, start_date: fmtDate(start), end_date: fmtDate(rangeEnd), note });
    onBookingsChange(updated);
    clearSelection();
  }

  async function handleDelete(id) {
    const updated = await deleteBooking(id);
    onBookingsChange(updated);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const nights = start && end ? Math.round((rangeEnd - rangeStart) / 86400000) : 0;

  return (
    <div>
      <div className="legend">
        {members.map((m) => (
          <div key={m.id} className="legend-chip">
            <span className="legend-dot" style={{ background: m.color }}></span>
            {m.name}
          </div>
        ))}
      </div>

      <div className="calendar">
        <div className="month-nav">
          <button onClick={prevMonth} aria-label="Mois précédent">‹</button>
          <span className="label">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} aria-label="Mois suivant">›</button>
        </div>
        <div className="weekdays">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div className="days-grid">
          {cells.map((cellDate, i) => {
            if (!cellDate) return <div key={i} className="day-cell empty" />;
            const isToday = cellDate.toDateString() === today.toDateString();
            const isPast = cellDate < today;
            const dayBookings = bookings.filter((b) => cellDate >= parseDate(b.start_date) && cellDate <= parseDate(b.end_date));
            const isRangeStart = start && cellDate.toDateString() === start.toDateString();
            const isRangeEnd = (end || start) && cellDate.toDateString() === (end || start).toDateString() && start;
            const isInRange = start && end && cellDate > rangeStart && cellDate < rangeEnd;
            const cls = [
              'day-cell',
              isPast ? 'past' : '',
              isToday ? 'today' : '',
              isRangeStart ? 'range-start' : '',
              isRangeEnd ? 'range-end' : '',
              isInRange ? 'in-range' : '',
              dayBookings.length > 0 ? 'has-booking' : '',
            ].filter(Boolean).join(' ');
            return (
              <div key={i} className={cls} onClick={() => handleDayClick(cellDate)}>
                <span className="day-num">{cellDate.getDate()}</span>
                {dayBookings.slice(0, 1).map((b) => {
                  const m = memberById[b.member_id];
                  return <span key={b.id} className="day-dot" style={{ background: m?.color || '#999' }} />;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {start && (
        <div className="booking-sheet">
          <h2>{formatRange(fmtDate(start), fmtDate(rangeEnd))}{end ? ` · ${nights} nuit${nights > 1 ? 's' : ''}` : ''}</h2>
          {hasConflict && <div className="conflict-warning">Attention : ces dates chevauchent déjà une réservation.</div>}
          <select className="field" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input type="text" placeholder="Motif (optionnel) — ex : week-end à la mer" value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={clearSelection}>Annuler</button>
            <button className="btn primary" style={{ flex: 1 }} onClick={handleConfirm} disabled={!end}>
              {end ? 'Réserver le van' : 'Choisissez la date de retour'}
            </button>
          </div>
        </div>
      )}

      <h2 className="section-title">Prochains trajets</h2>
      {upcoming.length === 0 && <div className="empty-state">Aucun trajet prévu. Sélectionnez des dates ci-dessus.</div>}
      {upcoming.map((b) => {
        const m = memberById[b.member_id];
        const conflict = bookings.some((o) => o.id !== b.id && overlaps(parseDate(b.start_date), parseDate(b.end_date), parseDate(o.start_date), parseDate(o.end_date)));
        return (
          <div key={b.id} className="ticket">
            <div className="ticket-top">
              <Avatar member={m} />
              <div style={{ flex: 1 }}>
                <div className="ticket-name">{m?.name}</div>
                <div className="ticket-dates">{formatRange(b.start_date, b.end_date)}</div>
                {b.note && <div className="ticket-note">{b.note}</div>}
                {conflict && <div className="ticket-conflict">Chevauche une autre réservation</div>}
              </div>
              <button className="ticket-del" aria-label="Supprimer" onClick={() => handleDelete(b.id)}>✕</button>
            </div>
            <CommentThread
              targetType="booking"
              targetId={b.id}
              comments={comments}
              members={members}
              currentMember={currentMember}
              onCommentsChange={onCommentsChange}
            />
          </div>
        );
      })}

      <div className="booking-bar">
        <div className="booking-bar-info">
          {!start && <div className="booking-bar-hint">Sélectionnez une date de départ</div>}
          {start && !end && (
            <>
              <div className="booking-bar-label">Départ</div>
              <div className="booking-bar-value">{formatRange(fmtDate(start), fmtDate(start))} · choisissez le retour</div>
            </>
          )}
          {start && end && (
            <>
              <div className="booking-bar-label">Trajet sélectionné</div>
              <div className="booking-bar-value">{formatRange(fmtDate(start), fmtDate(end))} · {nights} nuit{nights > 1 ? 's' : ''}</div>
            </>
          )}
        </div>
        <button className="btn primary" disabled={!end} onClick={handleConfirm}>Réserver</button>
      </div>
    </div>
  );
}
