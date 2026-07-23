import { getMaintenanceStatus, STATUS_ORDER } from '../../lib/maintenance';

export default function MaintenanceCard({ maintenanceItems, currentKm, onGoToTab }) {
  const withStatus = maintenanceItems
    .map((item) => ({ item, status: getMaintenanceStatus(item, currentKm) }))
    .filter(({ status }) => status.status === 'retard' || status.status === 'bientot')
    .sort((a, b) => STATUS_ORDER[a.status.status] - STATUS_ORDER[b.status.status]);

  return (
    <div className="home-card maintenance-card" onClick={() => onGoToTab('entretien')}>
      <div className="home-card-title">Entretien</div>
      {withStatus.length === 0 ? (
        <div className="maintenance-ok">✅ Rien à prévoir pour l&apos;instant.</div>
      ) : (
        <div className="maintenance-list">
          {withStatus.slice(0, 3).map(({ item, status }) => (
            <div key={item.id} className="maintenance-row">
              <span className={`maintenance-dot ${status.status}`} />
              <span className="maintenance-name">{item.name}</span>
              <span className="maintenance-when">
                {status.status === 'retard'
                  ? 'en retard'
                  : status.kmLeft != null
                    ? `dans ${status.kmLeft.toLocaleString('fr-FR')} km`
                    : `dans ${status.daysLeft} j.`}
              </span>
            </div>
          ))}
          {withStatus.length > 3 && <div className="maintenance-more">+{withStatus.length - 3} autre{withStatus.length - 3 > 1 ? 's' : ''}</div>}
        </div>
      )}
    </div>
  );
}
