'use client';
import { getMaintenanceStatus, STATUS_ORDER } from '../lib/maintenance';
import { haptic } from '../lib/haptics';

export default function DashboardOverview({ maintenanceItems, currentKm, onGoToTab }) {
  const maintAlerts = maintenanceItems
    .map((item) => ({ item, status: getMaintenanceStatus(item, currentKm) }))
    .filter(({ status }) => status.status === 'retard' || status.status === 'bientot')
    .sort((a, b) => STATUS_ORDER[a.status.status] - STATUS_ORDER[b.status.status]);

  if (maintAlerts.length === 0) return null;

  function go(tab) {
    haptic.tap();
    onGoToTab(tab);
  }

  return (
    <div className="dash-overview">
      <button className="dash-alert-card maint" onClick={() => go('entretien')}>
        <span className="dash-alert-icon">🔧</span>
        <span className="dash-alert-body">
          <span className="dash-alert-title">
            {maintAlerts.length} entretien{maintAlerts.length > 1 ? 's' : ''} à prévoir
          </span>
          <span className="dash-alert-detail">
            {maintAlerts.slice(0, 2).map(({ item, status }) => (
              <span key={item.id} className={`dash-alert-chip ${status.status}`}>{item.name}</span>
            ))}
            {maintAlerts.length > 2 && <span className="dash-alert-chip more">+{maintAlerts.length - 2}</span>}
          </span>
        </span>
      </button>
    </div>
  );
}
