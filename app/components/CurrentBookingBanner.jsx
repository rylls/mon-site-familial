'use client';
import Avatar from './Avatar';
import { parseDate, formatRange, startOfToday } from '../lib/dates';

export default function CurrentBookingBanner({ bookings, members }) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const today = startOfToday();

  const current = bookings.find((b) => parseDate(b.start_date) <= today && today <= parseDate(b.end_date));
  const next = !current && bookings
    .filter((b) => parseDate(b.start_date) > today)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))[0];

  const booking = current || next;

  if (!booking) {
    return <div className="banner banner-none">Aucun trajet en cours ou prévu. Réservez le van ci-dessous.</div>;
  }

  const m = memberById[booking.member_id];
  const daysLeft = Math.round((parseDate(booking.start_date) - today) / 86400000);

  return (
    <div className="banner" style={{ background: `linear-gradient(135deg, ${m?.color || '#333'}, ${shade(m?.color)})` }}>
      <div className="banner-eyebrow">{current ? 'Sur la route en ce moment' : daysLeft === 0 ? 'Départ aujourd\'hui' : `Dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}</div>
      <div className="banner-main">
        <Avatar member={m} size="lg" />
        <div>
          <div className="banner-dates">{formatRange(booking.start_date, booking.end_date)}</div>
          <div className="banner-sub">{m?.name}{booking.note ? ` · ${booking.note}` : ''}</div>
        </div>
      </div>
    </div>
  );
}

function shade(hex) {
  if (!hex) return '#555';
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 30);
  const g = Math.max(0, ((n >> 8) & 0xff) - 30);
  const b = Math.max(0, (n & 0xff) - 30);
  return `rgb(${r},${g},${b})`;
}
