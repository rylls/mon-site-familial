'use client';
import Avatar from './Avatar';
import { PineTreeIcon } from './decor/DoodleIcons';
import { haptic } from '../lib/haptics';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const TILES = [
  { tab: 'calendrier', icon: '📅', label: 'Calendrier', desc: 'Voir et réserver des dates' },
  { tab: 'van', icon: 'tree', label: 'Le van', desc: 'Inventaire embarqué' },
  { tab: 'entretien', icon: '🔧', label: 'Entretien', desc: 'Plan de maintenance' },
  { tab: 'activite', icon: '📖', label: 'Activité', desc: 'Tout l\'historique' },
];

export default function HomeView({ activity, onGoToTab }) {
  function go(tab) {
    haptic.select();
    onGoToTab(tab);
  }

  return (
    <div className="home-view">
      <div className="home-tiles">
        {TILES.map((t) => (
          <button key={t.tab} className="home-tile" onClick={() => go(t.tab)}>
            <span className="home-tile-icon">
              {t.icon === 'tree' ? <PineTreeIcon size={26} color="#C1622D" /> : t.icon}
            </span>
            <span className="home-tile-label">{t.label}</span>
            <span className="home-tile-desc">{t.desc}</span>
          </button>
        ))}
      </div>

      <div className="section-title-row">
        <h2 className="section-title"><span>📖</span> Activité récente</h2>
        {activity.length > 0 && (
          <button className="btn small" onClick={() => go('activite')}>Tout voir</button>
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
