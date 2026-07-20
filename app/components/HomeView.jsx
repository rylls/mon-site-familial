'use client';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { updateInventoryLevel } from '../actions';
import { parseDate, formatRange, startOfToday } from '../lib/dates';
import { fetchDailyWeather, weatherEmoji } from '../lib/weather';
import { fmtDate } from '../lib/dates';
import { haptic } from '../lib/haptics';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function WeatherCard({ nextTrip }) {
  const [weather, setWeather] = useState(undefined);

  useEffect(() => {
    if (!nextTrip) { setWeather(undefined); return; }
    let cancelled = false;
    setWeather(undefined);
    fetchDailyWeather(fmtDate(parseDate(nextTrip.start_date))).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => { cancelled = true; };
  }, [nextTrip?.id]);

  if (!nextTrip || weather === null) return null;

  return (
    <div className="home-card weather-card">
      <div className="home-card-title">Météo au départ</div>
      {weather === undefined ? (
        <div className="weather-loading">…</div>
      ) : (
        <div className="weather-body">
          <span className="weather-emoji">{weatherEmoji(weather.code)}</span>
          <div>
            <div className="weather-temps">{weather.min}° / {weather.max}°</div>
            <div className="weather-date">{formatRange(nextTrip.start_date, nextTrip.start_date)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownCard({ nextTrip, member }) {
  if (!nextTrip) return null;
  const today = startOfToday();
  const daysLeft = Math.max(0, Math.round((parseDate(nextTrip.start_date) - today) / 86400000));
  const scale = 21;
  const progress = Math.max(4, 100 - Math.min(daysLeft, scale) / scale * 100);

  return (
    <div className="home-card countdown-card">
      <div className="home-card-title">Prochain départ</div>
      <div className="countdown-label">
        {daysLeft === 0 ? 'C\'est aujourd\'hui !' : `Dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
        {member ? ` · ${member.name}` : ''}
      </div>
      <div className="countdown-track">
        <div className="countdown-fill" style={{ width: `${progress}%`, background: member?.color }} />
        <span className="countdown-van" style={{ left: `calc(${progress}% - 12px)` }}>🚐</span>
      </div>
    </div>
  );
}

function AnecdoteCard({ pastTrip, member }) {
  if (!pastTrip || !pastTrip.note) return null;
  return (
    <div className="home-card anecdote-card">
      <div className="home-card-title">Dernier trajet</div>
      <div className="anecdote-body">
        <Avatar member={member} size="sm" />
        <div>
          <div className="anecdote-quote">« {pastTrip.note} »</div>
          <div className="anecdote-meta">{member?.name} · {formatRange(pastTrip.start_date, pastTrip.end_date)}</div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ bookings, mileageLogs, members }) {
  const year = new Date().getFullYear();
  const thisYearBookings = bookings.filter((b) => parseDate(b.start_date).getFullYear() === year);
  const nights = thisYearBookings.reduce((sum, b) => sum + Math.max(1, Math.round((parseDate(b.end_date) - parseDate(b.start_date)) / 86400000)), 0);

  const countByMember = {};
  for (const b of thisYearBookings) countByMember[b.member_id] = (countByMember[b.member_id] || 0) + 1;
  const topMemberId = Object.keys(countByMember).sort((a, b) => countByMember[b] - countByMember[a])[0];
  const topMember = members.find((m) => m.id === topMemberId);

  const logsThisYear = mileageLogs.filter((l) => new Date(l.recorded_at).getFullYear() === year).sort((a, b) => a.km - b.km);
  const kmThisYear = logsThisYear.length >= 2 ? logsThisYear[logsThisYear.length - 1].km - logsThisYear[0].km : null;
  const currentKm = mileageLogs[0]?.km ?? null;

  return (
    <div className="home-card stats-card">
      <div className="home-card-title">Carnet de bord {year}</div>
      <div className="stats-grid">
        <div className="stat-tile">
          <div className="stat-value">{nights}</div>
          <div className="stat-label">nuit{nights > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{thisYearBookings.length}</div>
          <div className="stat-label">trajet{thisYearBookings.length > 1 ? 's' : ''}</div>
        </div>
        {kmThisYear != null && (
          <div className="stat-tile">
            <div className="stat-value">{kmThisYear.toLocaleString('fr-FR')}</div>
            <div className="stat-label">km parcourus</div>
          </div>
        )}
        {currentKm != null && (
          <div className="stat-tile">
            <div className="stat-value">{currentKm.toLocaleString('fr-FR')}</div>
            <div className="stat-label">km au compteur</div>
          </div>
        )}
      </div>
      {topMember && (
        <div className="stats-top-member">
          <Avatar member={topMember} size="sm" /> {topMember.name} a le plus utilisé le van cette année
        </div>
      )}
    </div>
  );
}

function DepartureChecklist({ inventory, onItemsChange, currentMember }) {
  const [busyId, setBusyId] = useState(null);
  const fullCount = inventory.filter((i) => i.level === 'plein').length;
  const total = inventory.length;
  const progress = total > 0 ? Math.round((fullCount / total) * 100) : 100;

  async function toggle(item) {
    haptic.tap();
    setBusyId(item.id);
    const nextLevel = item.level === 'plein' ? 'vide' : 'plein';
    try {
      const updated = await updateInventoryLevel(item.id, nextLevel, currentMember?.id);
      onItemsChange(updated);
    } finally {
      setBusyId(null);
    }
  }

  if (total === 0) return null;

  return (
    <div className="home-card checklist-card">
      <div className="home-card-title-row">
        <div className="home-card-title">Checklist de départ</div>
        <div className="checklist-count">{fullCount}/{total}</div>
      </div>
      <div className="checklist-progress">
        <div className="checklist-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="checklist-items">
        {inventory.map((item) => (
          <button
            key={item.id}
            className={`checklist-item${item.level === 'plein' ? ' checked' : ''}`}
            onClick={() => toggle(item)}
            disabled={busyId === item.id}
          >
            <span className="checklist-box">{item.level === 'plein' ? '✓' : ''}</span>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomeView({ activity, bookings, members, inventory, mileageLogs, currentMember, onItemsChange, onGoToTab }) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const today = startOfToday();

  const nextTrip = bookings
    .filter((b) => parseDate(b.start_date) >= today)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))[0];

  const pastTrip = bookings
    .filter((b) => parseDate(b.end_date) < today && b.note)
    .sort((a, b) => parseDate(b.end_date) - parseDate(a.end_date))[0];

  return (
    <div className="home-view">
      <div className="home-grid">
        <CountdownCard nextTrip={nextTrip} member={nextTrip ? memberById[nextTrip.member_id] : null} />
        <WeatherCard nextTrip={nextTrip} />
        <AnecdoteCard pastTrip={pastTrip} member={pastTrip ? memberById[pastTrip.member_id] : null} />
        <StatsCard bookings={bookings} mileageLogs={mileageLogs} members={members} />
      </div>

      <DepartureChecklist inventory={inventory} onItemsChange={onItemsChange} currentMember={currentMember} />

      <div className="section-title-row">
        <h2 className="section-title"><span>📖</span> Activité récente</h2>
        {activity.length > 0 && (
          <button className="btn small" onClick={() => onGoToTab('activite')}>Tout voir</button>
        )}
      </div>
      {activity.length === 0 && <div className="empty-state">Rien à signaler pour l'instant.</div>}
      {activity.slice(0, 4).map((a) => (
        <div key={a.id} className="activity-row">
          <Avatar member={a.member} size="sm" />
          <div className="activity-body">
            <div className="activity-text">
              <span className="activity-icon">{a.icon}</span>
              <strong>{a.member?.name || 'Quelqu\'un'}</strong> {a.text}
            </div>
            <div className="activity-time">{timeAgo(a.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
