import { parseDate, startOfToday } from '../../lib/dates';

export default function CountdownCard({ trip, member, isActive }) {
  if (!trip) return null;
  const today = startOfToday();
  const start = parseDate(trip.start_date);
  const end = parseDate(trip.end_date);

  if (!isActive) {
    const daysLeft = Math.max(0, Math.round((start - today) / 86400000));
    return (
      <div className="home-card countdown-card">
        <div className="home-card-title">Prochain départ</div>
        <div className="countdown-label">
          {daysLeft === 0 ? 'C\'est aujourd\'hui !' : `Dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
          {member ? ` · ${member.name}` : ''}
        </div>
        <div className="countdown-track pending">
          <span className="countdown-van pending">🚐</span>
        </div>
      </div>
    );
  }

  const totalDays = Math.max(1, Math.round((end - start) / 86400000));
  const elapsed = Math.round((today - start) / 86400000);
  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const daysLeft = Math.max(0, Math.round((end - today) / 86400000));

  return (
    <div className="home-card countdown-card">
      <div className="home-card-title">Voyage en cours</div>
      <div className="countdown-label">
        {daysLeft === 0 ? 'Retour aujourd\'hui' : `Retour dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
        {member ? ` · ${member.name}` : ''}
      </div>
      <div className="countdown-track active">
        <div className="countdown-fill" style={{ width: `${progress}%`, background: member?.color }} />
        <span className="countdown-van active" style={{ left: `calc(${progress}% - 12px)` }}>🚐</span>
        <span className="countdown-flag">🏁</span>
      </div>
    </div>
  );
}
