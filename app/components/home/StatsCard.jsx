import Avatar from '../Avatar';
import { parseDate, startOfToday } from '../../lib/dates';

export default function StatsCard({ bookings, mileageLogs, members }) {
  const year = new Date().getFullYear();
  const thisYearBookings = bookings.filter((b) => b.type !== 'maintenance' && parseDate(b.start_date).getFullYear() === year);
  const nights = thisYearBookings.reduce((sum, b) => sum + Math.max(1, Math.round((parseDate(b.end_date) - parseDate(b.start_date)) / 86400000)), 0);
  const avgNights = thisYearBookings.length > 0 ? Math.round((nights / thisYearBookings.length) * 10) / 10 : 0;

  const logsThisYear = mileageLogs.filter((l) => new Date(l.recorded_at).getFullYear() === year).sort((a, b) => a.km - b.km);
  const kmThisYear = logsThisYear.length >= 2 ? logsThisYear[logsThisYear.length - 1].km - logsThisYear[0].km : null;
  const currentKm = mileageLogs[0]?.km ?? null;

  const countByMember = {};
  for (const b of thisYearBookings) countByMember[b.member_id] = (countByMember[b.member_id] || 0) + 1;
  const ranking = members
    .map((m) => ({ member: m, count: countByMember[m.id] || 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCount = ranking[0]?.count || 1;

  const today = startOfToday();
  const lastEnded = bookings
    .filter((b) => parseDate(b.end_date) < today)
    .sort((a, b) => parseDate(b.end_date) - parseDate(a.end_date))[0];
  const daysSinceLast = lastEnded ? Math.round((today - parseDate(lastEnded.end_date)) / 86400000) : null;

  return (
    <div className="home-card stats-card">
      <div className="home-card-title">Carnet de bord {year}</div>
      <div className="stats-grid">
        <div className="stat-tile">
          <div className="stat-icon">🌙</div>
          <div className="stat-value">{nights}</div>
          <div className="stat-label">nuit{nights > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">🚐</div>
          <div className="stat-value">{thisYearBookings.length}</div>
          <div className="stat-label">trajet{thisYearBookings.length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">📏</div>
          <div className="stat-value">{avgNights || '—'}</div>
          <div className="stat-label">nuits / trajet</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">🛣️</div>
          <div className="stat-value">{kmThisYear != null ? kmThisYear.toLocaleString('fr-FR') : '—'}</div>
          <div className="stat-label">km parcourus</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{currentKm != null ? currentKm.toLocaleString('fr-FR') : '—'}</div>
          <div className="stat-label">km au compteur</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{daysSinceLast != null ? daysSinceLast : '—'}</div>
          <div className="stat-label">j. depuis le dernier</div>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="stats-ranking">
          <div className="stats-ranking-title">Utilisation par membre</div>
          {ranking.map(({ member, count }) => (
            <div key={member.id} className="stats-ranking-row">
              <Avatar member={member} size="xs" />
              <span className="stats-ranking-name">{member.name}</span>
              <div className="stats-ranking-bar">
                <div className="stats-ranking-fill" style={{ width: `${(count / maxCount) * 100}%`, background: member.color }} />
              </div>
              <span className="stats-ranking-count">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
