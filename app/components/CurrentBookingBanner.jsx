'use client';
import { useState } from 'react';
import Avatar from './Avatar';
import { parseDate, formatRange, startOfToday } from '../lib/dates';
import { haptic } from '../lib/haptics';

export default function CurrentBookingBanner({ bookings, members, inventory = [], onOpenTripEnd }) {
  const [index, setIndex] = useState(0);
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const today = startOfToday();
  const notFullCount = inventory.filter((i) => i.level !== 'plein').length;

  const isCurrent = (b) => parseDate(b.start_date) <= today && today <= parseDate(b.end_date);

  const trips = [
    ...bookings.filter(isCurrent).sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date)),
    ...bookings
      .filter((b) => parseDate(b.start_date) > today)
      .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date)),
  ];

  if (trips.length === 0) {
    return (
      <div className="banner banner-none">
        <img src="/images/van-banner.png" alt="" className="banner-none-van" />
        Aucun trajet en cours ou prévu. Réservez le van ci-dessous.
      </div>
    );
  }

  const safeIndex = Math.min(index, trips.length - 1);
  const booking = trips[safeIndex];
  const current = isCurrent(booking);
  const m = memberById[booking.member_id];
  const daysLeft = Math.round((parseDate(booking.start_date) - today) / 86400000);

  function go(delta) {
    haptic.tap();
    setIndex((i) => Math.max(0, Math.min(trips.length - 1, i + delta)));
  }

  return (
    <div className="banner" style={{ background: `linear-gradient(180deg, ${m?.color || '#333'}, ${shade(m?.color)})` }}>
      <div className="banner-van-strip">
        <img src="/images/van-banner.png" alt="" className="banner-van-img" />
      </div>

      {trips.length > 1 && (
        <div className="banner-nav">
          <button className="banner-nav-btn" onClick={() => go(-1)} disabled={safeIndex === 0} aria-label="Trajet précédent">‹</button>
          <div className="banner-dots">
            {trips.map((_, i) => (
              <span key={i} className={`banner-dot${i === safeIndex ? ' active' : ''}`} />
            ))}
          </div>
          <button className="banner-nav-btn" onClick={() => go(1)} disabled={safeIndex === trips.length - 1} aria-label="Trajet suivant">›</button>
        </div>
      )}

      <div className="banner-eyebrow">
        {current ? 'Sur la route en ce moment' : daysLeft === 0 ? 'Départ aujourd\'hui' : `Dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
      </div>
      <div className="banner-main">
        <Avatar member={m} size="lg" />
        <div>
          <div className="banner-dates">{formatRange(booking.start_date, booking.end_date)}</div>
          <div className="banner-sub">{m?.name}{booking.note ? ` · ${booking.note}` : ''}</div>
        </div>
      </div>

      {notFullCount > 0 && (
        <div className="banner-checklist">
          ⚠️ {notFullCount} objet{notFullCount > 1 ? 's' : ''} à recharger avant le départ
        </div>
      )}

      {current && (
        <button
          className="banner-trip-end"
          onClick={() => { haptic.success(); onOpenTripEnd?.(); }}
        >
          ✅ Voyage terminé — faire le point rapide
        </button>
      )}
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
