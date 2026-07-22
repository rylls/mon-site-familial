'use client';
import { useRef, useState } from 'react';
import { addBooking, deleteBooking, editBooking } from '../actions';
import { parseDate, fmtDate, overlaps, formatRange, startOfToday } from '../lib/dates';
import Avatar from './Avatar';
import CommentThread from './CommentThread';
import { MiniVanIcon, TicketPathIcon } from './decor/DoodleIcons';
import { haptic } from '../lib/haptics';
import { useToast } from './ToastProvider';

const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const WEEKDAY_NAMES = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const MAINTENANCE_COLOR = '#6B5B4D';

export default function Calendar({ members, bookings, onBookingsChange, comments, onCommentsChange, currentMember }) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState(currentMember?.id || members[0]?.id);
  const [editingId, setEditingId] = useState(null);
  const [bookingType, setBookingType] = useState('trip');
  const sheetRef = useRef(null);
  const showToast = useToast();
  const deleteTimersRef = useRef({});

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
  const hasConflict = start && bookings.some((b) => b.id !== editingId && overlaps(rangeStart, rangeEnd, parseDate(b.start_date), parseDate(b.end_date)));

  const upcoming = bookings
    .filter((b) => parseDate(b.end_date) >= today)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date));

  function handleDayClick(date) {
    if (date < today) return;
    haptic.tap();
    if (!start) { setStart(date); setEnd(null); return; }
    if (start && !end) {
      if (date < start) { setStart(date); return; }
      setEnd(date);
      return;
    }
    setStart(date); setEnd(null);
  }

  function clearSelection() {
    setStart(null); setEnd(null); setNote(''); setEditingId(null); setBookingType('trip');
  }

  function handleEdit(b) {
    haptic.tap();
    setStart(parseDate(b.start_date));
    setEnd(parseDate(b.end_date));
    setNote(b.note || '');
    setMemberId(b.member_id);
    setBookingType(b.type || 'trip');
    setEditingId(b.id);
    sheetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handleConfirm() {
    if (!start || !memberId) return;
    const wasEditing = !!editingId;
    const updated = editingId
      ? await editBooking(editingId, { start_date: fmtDate(start), end_date: fmtDate(rangeEnd), note, type: bookingType })
      : await addBooking({ member_id: memberId, start_date: fmtDate(start), end_date: fmtDate(rangeEnd), note, type: bookingType });
    haptic.success();
    onBookingsChange(updated);
    showToast(wasEditing ? 'Modifié' : bookingType === 'maintenance' ? 'Immobilisation ajoutée 🔧' : 'Trajet réservé 🚐');
    clearSelection();
  }

  function handleDelete(id) {
    haptic.delete();
    const snapshot = bookings;
    const wasMaintenance = bookings.find((b) => b.id === id)?.type === 'maintenance';
    onBookingsChange(bookings.filter((b) => b.id !== id));
    if (editingId === id) clearSelection();
    showToast(wasMaintenance ? 'Immobilisation supprimée' : 'Trajet supprimé', {
      type: 'danger',
      duration: 5000,
      actionLabel: 'Annuler',
      onAction: () => {
        clearTimeout(deleteTimersRef.current[id]);
        delete deleteTimersRef.current[id];
        onBookingsChange(snapshot);
      },
    });
    deleteTimersRef.current[id] = setTimeout(async () => {
      delete deleteTimersRef.current[id];
      onBookingsChange(await deleteBooking(id));
    }, 5000);
  }

  function prevMonth() {
    haptic.tap();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    haptic.tap();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function handleCellKeyDown(e, date, disabled) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(date);
    }
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
        <div className="legend-chip">
          <span className="legend-dot" style={{ background: MAINTENANCE_COLOR }}></span>
          🔧 Entretien
        </div>
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
            const primary = dayBookings[0];
            const pMember = primary ? memberById[primary.member_id] : null;
            const isMaintenance = primary?.type === 'maintenance';
            const cellColor = isMaintenance ? MAINTENANCE_COLOR : pMember?.color || '#999';
            const isBookingStart = primary && cellDate.toDateString() === parseDate(primary.start_date).toDateString();
            const isBookingEnd = primary && cellDate.toDateString() === parseDate(primary.end_date).toDateString();
            const isMultiDay = primary && primary.start_date !== primary.end_date;
            const isSelecting = start && cellDate.toDateString() === start.toDateString();
            const isSelectingEnd = (end || start) && cellDate.toDateString() === (end || start).toDateString() && start;
            const isSelectingRange = start && end && cellDate > rangeStart && cellDate < rangeEnd;
            const col = i % 7;
            const cls = [
              'day-cell',
              isPast ? 'past' : '',
              isToday ? 'today' : '',
              primary ? 'range-fill' : '',
              primary && (isBookingStart || col === 0) ? 'range-rounded-left' : '',
              primary && (isBookingEnd || col === 6) ? 'range-rounded-right' : '',
              (isSelecting || isSelectingEnd || isSelectingRange) ? 'selecting' : '',
              (isSelecting || col === 0) && (start && end && cellDate >= rangeStart && cellDate <= rangeEnd) ? 'range-rounded-left' : '',
              (isSelectingEnd || col === 6) && (start && end && cellDate >= rangeStart && cellDate <= rangeEnd) ? 'range-rounded-right' : '',
            ].filter(Boolean).join(' ');
            const label = `${cellDate.getDate()} ${MONTHS[cellDate.getMonth()]}${primary ? (isMaintenance ? ', van chez le garagiste' : `, réservé par ${pMember?.name}`) : ''}`;
            return (
              <div
                key={i}
                className={cls}
                style={primary ? { background: cellColor } : undefined}
                onClick={() => handleDayClick(cellDate)}
                role="button"
                tabIndex={isPast ? -1 : 0}
                aria-label={label}
                aria-disabled={isPast}
                onKeyDown={(e) => handleCellKeyDown(e, cellDate, isPast)}
              >
                {primary && isBookingStart && isMultiDay && (
                  <span className="range-badge-van">
                    {isMaintenance ? <span className="range-badge-wrench">🔧</span> : <MiniVanIcon size={13} color={cellColor} />}
                  </span>
                )}
                {primary && isBookingEnd && (
                  <span className="range-badge-avatar">
                    {isMaintenance ? <span className="range-badge-wrench">🔧</span> : <Avatar member={pMember} size="badge" />}
                  </span>
                )}
                <span className="day-num">{cellDate.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {start && (
        <div className="booking-sheet" ref={sheetRef}>
          <h2>
            {editingId ? 'Modifier · ' : ''}
            {formatRange(fmtDate(start), fmtDate(rangeEnd))}{end ? ` · ${nights} nuit${nights > 1 ? 's' : ''}` : ''}
          </h2>
          {hasConflict && <div className="conflict-warning">Attention : ces dates chevauchent déjà une réservation.</div>}
          <div className="booking-type-toggle">
            <button
              type="button"
              className={`booking-type-btn${bookingType === 'trip' ? ' active' : ''}`}
              onClick={() => { haptic.tap(); setBookingType('trip'); }}
            >
              🚐 Trajet en famille
            </button>
            <button
              type="button"
              className={`booking-type-btn${bookingType === 'maintenance' ? ' active' : ''}`}
              onClick={() => { haptic.tap(); setBookingType('maintenance'); }}
            >
              🔧 Entretien / garage
            </button>
          </div>
          <select className="field" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input
            type="text"
            placeholder={bookingType === 'maintenance' ? 'Motif — ex : contrôle technique, vidange…' : 'Motif (optionnel) — ex : week-end à la mer'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={clearSelection}>Annuler</button>
            <button className="btn primary" style={{ flex: 1 }} onClick={handleConfirm} disabled={!end}>
              {!end ? 'Choisissez la date de retour' : editingId ? 'Enregistrer les modifications' : bookingType === 'maintenance' ? 'Bloquer ces dates' : 'Réserver le van'}
            </button>
          </div>
        </div>
      )}

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
              <div className="booking-bar-label">{editingId ? 'Modification en cours' : 'Trajet sélectionné'}</div>
              <div className="booking-bar-value">{formatRange(fmtDate(start), fmtDate(end))} · {nights} nuit{nights > 1 ? 's' : ''}</div>
            </>
          )}
        </div>
        <button className="btn primary" disabled={!end} onClick={handleConfirm}>{editingId ? 'Enregistrer' : 'Réserver'}</button>
      </div>

      <h2 className="section-title"><TicketPathIcon size={20} /> Prochains trajets</h2>
      {upcoming.length === 0 && <div className="empty-state">Aucun trajet prévu. Sélectionnez des dates ci-dessus.</div>}
      {upcoming.map((b) => {
        const m = memberById[b.member_id];
        const isMaintenance = b.type === 'maintenance';
        const conflict = bookings.some((o) => o.id !== b.id && overlaps(parseDate(b.start_date), parseDate(b.end_date), parseDate(o.start_date), parseDate(o.end_date)));
        return (
          <div key={b.id} className={`ticket${isMaintenance ? ' ticket-maintenance' : ''}`} style={{ borderLeftColor: isMaintenance ? MAINTENANCE_COLOR : m?.color }}>
            <div className="ticket-top">
              {isMaintenance ? <span className="ticket-wrench">🔧</span> : <Avatar member={m} />}
              <div style={{ flex: 1 }}>
                <div className="ticket-name">{isMaintenance ? (b.note || 'Entretien / garage') : m?.name}</div>
                <div className="ticket-dates">{formatRange(b.start_date, b.end_date)}</div>
                {!isMaintenance && b.note && <div className="ticket-note">{b.note}</div>}
                {isMaintenance && <div className="ticket-note">Enregistré par {m?.name}</div>}
                {conflict && <div className="ticket-conflict">Chevauche une autre réservation</div>}
              </div>
              <button className="ticket-edit" aria-label="Modifier" onClick={() => handleEdit(b)}>✎</button>
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
    </div>
  );
}
