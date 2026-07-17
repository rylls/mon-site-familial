'use client';
import { useState } from 'react';
import { addBooking, deleteBooking } from '../actions';
import Avatar from './Avatar';

const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function overlaps(aS, aE, bS, bE) {
  return aS <= bE && bS <= aE;
}
function formatRange(startStr, endStr) {
  const s = parseDate(startStr), e = parseDate(endStr);
  const opts = { day: 'numeric', month: 'short' };
  if (startStr === endStr) return s.toLocaleDateString('fr-FR', opts);
  return `${s.toLocaleDateString('fr-FR', opts)} → ${e.toLocaleDateString('fr-FR', opts)}`;
}

export default function Calendar({ members, initialBookings, currentMember }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState(currentMember?.id || members[0]?.id);

  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));

  const today = new Date();
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const hasConflict = start && end && bookings.some((b) => overlaps(parseDate(start), parseDate(end || start), parseDate(b.start_date), parseDate(b.end_date)));

  const upcoming = bookings
    .filter((b) => parseDate(b.end_date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date));

  async function handleAdd() {
    if (!start || !memberId) return;
    const updated = await addBooking({ member_id: memberId, start_date: start, end_date: end || start, note });
    setBookings(updated);
    setStart(''); setEnd(''); setNote('');
  }

  async function handleDelete(id) {
    const updated = await deleteBooking(id);
    setBookings(updated);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

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
          <span className="label hand">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} aria-label="Mois suivant">›</button>
        </div>
        <div className="weekdays">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div className="days-grid">
          {cells.map((cellDate, i) => {
            if (!cellDate) return <div key={i} className="day-cell empty" />;
            const isToday = cellDate.toDateString() === today.toDateString();
            const dayBookings = bookings.filter((b) => cellDate >= parseDate(b.start_date) && cellDate <= parseDate(b.end_date));
            return (
              <div
                key={i}
                className={`day-cell${isToday ? ' today' : ''}`}
                onClick={() => { const s = fmtDate(cellDate); setStart(s); setEnd(s); }}
              >
                <span className="day-num">{cellDate.getDate()}</span>
                {dayBookings.slice(0, 3).map((b) => {
                  const m = memberById[b.member_id];
                  return (
                    <div
                      key={b.id}
                      className={`day-chip${dayBookings.length > 1 ? ' conflict' : ''}`}
                      style={{ background: m?.color || '#999' }}
                    >
                      {m?.name}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-card">
        <h2 className="hand">Réserver le van</h2>
        {hasConflict && <div className="conflict-warning">Attention : ces dates chevauchent déjà une réservation.</div>}
        <select className="field" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div className="row2">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <input type="text" placeholder="Motif (optionnel) — ex : week-end à la mer" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn primary" onClick={handleAdd}>Ajouter la réservation</button>
      </div>

      <h2 className="section-title">Prochains trajets</h2>
      {upcoming.length === 0 && <div className="empty-state">Aucun trajet prévu. Réservez le van ci-dessus.</div>}
      {upcoming.map((b) => {
        const m = memberById[b.member_id];
        const conflict = bookings.some((o) => o.id !== b.id && overlaps(parseDate(b.start_date), parseDate(b.end_date), parseDate(o.start_date), parseDate(o.end_date)));
        return (
          <div key={b.id} className="ticket" style={{ borderLeftColor: m?.color }}>
            <Avatar member={m} />
            <div style={{ flex: 1 }}>
              <div className="ticket-name">{m?.name}</div>
              <div className="ticket-dates">{formatRange(b.start_date, b.end_date)}</div>
              {b.note && <div className="ticket-note">{b.note}</div>}
              {conflict && <div className="ticket-conflict">Chevauche une autre réservation</div>}
            </div>
            <button className="ticket-del" aria-label="Supprimer" onClick={() => handleDelete(b.id)}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
