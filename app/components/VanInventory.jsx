'use client';
import { useState } from 'react';
import { updateInventoryLevel } from '../actions';
import { ZONES, ZONE_LABELS } from './zones';
import VanDiagram from './VanDiagram';

const LEVELS = ['vide', 'partiel', 'plein'];
const LEVEL_TEXT = { vide: 'vide', partiel: 'partiel', plein: 'plein' };

export default function VanInventory({ initialItems, currentMember }) {
  const [items, setItems] = useState(initialItems);
  const [zone, setZone] = useState(ZONES[0].id);

  const zoneItems = items.filter((i) => i.zone === zone);

  async function setLevel(id, level) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, level } : i)));
    await updateInventoryLevel(id, level, currentMember?.id);
  }

  return (
    <div>
      <VanDiagram selectedZone={zone} onSelectZone={setZone} />

      <div className="zone-tabs">
        {ZONES.map((z) => (
          <button key={z.id} className={`zone-tab${zone === z.id ? ' active' : ''}`} onClick={() => setZone(z.id)}>
            {z.label}
          </button>
        ))}
      </div>

      <h2 className="section-title">{ZONE_LABELS[zone]}</h2>
      {zoneItems.length === 0 && <div className="empty-state">Rien de référencé ici pour l'instant.</div>}
      {zoneItems.map((item) => (
        <div key={item.id} className="inv-item">
          <div className="inv-name">
            {item.name}
            {item.updated_at && <div className="inv-meta">mis à jour {new Date(item.updated_at).toLocaleDateString('fr-FR')}</div>}
          </div>
          <span className={`level-label ${item.level}`}>{LEVEL_TEXT[item.level]}</span>
          <div className="gauge">
            {LEVELS.map((lvl, idx) => (
              <div
                key={lvl}
                className={`gauge-seg${LEVELS.indexOf(item.level) >= idx ? ` on-${item.level}` : ''}`}
                onClick={() => setLevel(item.id, lvl)}
                title={LEVEL_TEXT[lvl]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
