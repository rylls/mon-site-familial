import Avatar from './Avatar';
import WeatherCard from './home/WeatherCard';
import CountdownCard from './home/CountdownCard';
import AnecdoteCard from './home/AnecdoteCard';
import MaintenanceCard from './home/MaintenanceCard';
import StatsCard from './home/StatsCard';
import ImportantInfoCard from './home/ImportantInfoCard';
import { parseDate, startOfToday } from '../lib/dates';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function HomeView({
  activity,
  bookings,
  members,
  mileageLogs,
  maintenanceItems,
  currentKm,
  importantInfo,
  onImportantInfoChange,
  onGoToTab,
}) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const today = startOfToday();

  const currentTrip = bookings.find((b) => b.type !== 'maintenance' && parseDate(b.start_date) <= today && today <= parseDate(b.end_date));
  const nextUpcoming = bookings
    .filter((b) => b.type !== 'maintenance' && parseDate(b.start_date) > today)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))[0];
  const trip = currentTrip || nextUpcoming;
  const isActive = !!currentTrip;

  const pastTrip = bookings
    .filter((b) => b.type !== 'maintenance' && parseDate(b.end_date) < today && b.note)
    .sort((a, b) => parseDate(b.end_date) - parseDate(a.end_date))[0];

  return (
    <div className="home-view">
      <div className="home-grid">
        <CountdownCard trip={trip} member={trip ? memberById[trip.member_id] : null} isActive={isActive} />
        <WeatherCard trip={trip} isActive={isActive} />
        {pastTrip?.note ? (
          <AnecdoteCard pastTrip={pastTrip} member={memberById[pastTrip.member_id]} />
        ) : (
          <MaintenanceCard maintenanceItems={maintenanceItems} currentKm={currentKm} onGoToTab={onGoToTab} />
        )}
        <StatsCard bookings={bookings} mileageLogs={mileageLogs} members={members} />
      </div>

      <ImportantInfoCard items={importantInfo} onItemsChange={onImportantInfoChange} />

      <div className="section-title-row">
        <h2 className="section-title"><span>📖</span> Activité récente</h2>
        {activity.length > 0 && (
          <button className="btn small" onClick={() => onGoToTab('activite')}>Tout voir</button>
        )}
      </div>
      {activity.length === 0 && <div className="empty-state">Rien à signaler pour l&apos;instant.</div>}
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
