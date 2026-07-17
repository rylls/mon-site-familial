'use client';
import { useState } from 'react';
import Avatar from './Avatar';
import { clearActivity } from '../actions';
import { haptic } from '../lib/haptics';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ActivityFeed({ activity, onClear }) {
  const [clearing, setClearing] = useState(false);

  async function handleClear() {
    if (!confirm('Effacer tout l\'historique d\'activité affiché ? Les réservations, commentaires et objets restent inchangés.')) return;
    setClearing(true);
    haptic.warning();
    const clearedAt = await clearActivity();
    onClear(clearedAt);
    setClearing(false);
  }

  return (
    <div>
      <div className="section-title-row">
        <h2 className="section-title"><span>📖</span> Activité récente</h2>
        {activity.length > 0 && (
          <button className="btn small" onClick={handleClear} disabled={clearing}>
            {clearing ? '…' : 'Effacer'}
          </button>
        )}
      </div>
      {activity.length === 0 && <div className="empty-state">Rien à signaler pour l'instant.</div>}
      {activity.map((a) => (
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
