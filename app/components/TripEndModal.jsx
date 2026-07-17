'use client';
import { useState } from 'react';
import { updateInventoryLevel } from '../actions';
import { ZONES, ZONE_LABELS } from './zones';
import { haptic } from '../lib/haptics';

const LEVELS = ['vide', 'partiel', 'plein'];

export default function TripEndModal({ items, onItemsChange, currentMember, onClose }) {
  const [drafts, setDrafts] = useState(Object.fromEntries(items.map((i) => [i.id, i.level])));
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState(false);

  const dirtyCount = items.filter((i) => drafts[i.id] !== i.level).length;

  function setLevel(id, level) {
    haptic.tap();
    setDrafts((prev) => ({ ...prev, [id]: level }));
  }

  function toggleZone(zoneId) {
    setCollapsed((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
  }

  async function handleSave() {
    setSaving(true);
    const changed = items.filter((i) => drafts[i.id] !== i.level);
    await Promise.all(changed.map((i) => updateInventoryLevel(i.id, drafts[i.id], currentMember?.id)));
    haptic.success();
    onItemsChange(items.map((i) => ({ ...i, level: drafts[i.id] })));
    setSaving(false);
    onClose();
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="tripend-card" onClick={(e) => e.stopPropagation()}>
        <h1>Bon retour ! 🚐</h1>
        <p>Fais le point sur ce qu'il reste, zone par zone. Tu peux replier ce qui ne t'intéresse pas.</p>

        {ZONES.map((z) => {
          const zoneItems = items.filter((i) => i.zone === z.id);
          if (zoneItems.length === 0) return null;
          const isCollapsed = collapsed[z.id];
          return (
            <div key={z.id} className="tripend-zone">
              <button className="tripend-zone-header" onClick={() => toggleZone(z.id)}>
                <span>{ZONE_LABELS[z.id]}</span>
                <span className="tripend-chevron">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed && zoneItems.map((item) => (
                <div key={item.id} className="tripend-item">
                  <span className="tripend-item-name">{item.name}</span>
                  <div className="gauge">
                    {LEVELS.map((lvl, idx) => (
                      <div
                        key={lvl}
                        className={`gauge-seg${LEVELS.indexOf(drafts[item.id]) >= idx ? ` on-${drafts[item.id]}` : ''}`}
                        onClick={() => setLevel(item.id, lvl)}
                        title={lvl}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn" onClick={onClose}>Plus tard</button>
          <button className="btn primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving || dirtyCount === 0}>
            {saving ? '…' : dirtyCount > 0 ? `Enregistrer (${dirtyCount})` : 'Rien à changer'}
          </button>
        </div>
      </div>
    </div>
  );
}
