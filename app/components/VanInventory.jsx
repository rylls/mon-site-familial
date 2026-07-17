'use client';
import { useState } from 'react';
import { updateInventoryLevel, addInventoryItem, deleteInventoryItem } from '../actions';
import { ZONES, ZONE_LABELS } from './zones';
import VanDiagram from './VanDiagram';
import CommentThread from './CommentThread';

const LEVELS = ['vide', 'partiel', 'plein'];
const LEVEL_TEXT = { vide: 'vide', partiel: 'partiel', plein: 'plein' };

export default function VanInventory({ initialItems, comments, onCommentsChange, members, currentMember }) {
  const [items, setItems] = useState(initialItems);
  const [zone, setZone] = useState(ZONES[0].id);
  const [newName, setNewName] = useState('');

  const zoneItems = items.filter((i) => i.zone === zone);

  async function setLevel(id, level) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, level } : i)));
    await updateInventoryLevel(id, level, currentMember?.id);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    const updated = await addInventoryItem({ zone, name: newName.trim() });
    setItems(updated);
    setNewName('');
  }

  async function handleDelete(id) {
    const updated = await deleteInventoryItem(id);
    setItems(updated);
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

      <div className="add-item-row">
        <input
          type="text"
          placeholder={`Ajouter un objet dans ${ZONE_LABELS[zone].toLowerCase()}…`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button className="btn primary" onClick={handleAdd} disabled={!newName.trim()}>Ajouter</button>
      </div>

      {zoneItems.length === 0 && <div className="empty-state">Rien de référencé ici pour l'instant.</div>}
      {zoneItems.map((item) => (
        <div key={item.id} className="inv-item">
          <div className="inv-item-top">
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
            <button className="item-del" aria-label="Supprimer l'objet" onClick={() => handleDelete(item.id)}>✕</button>
          </div>
          <CommentThread
            targetType="inventory_item"
            targetId={item.id}
            comments={comments}
            members={members}
            currentMember={currentMember}
            onCommentsChange={onCommentsChange}
          />
        </div>
      ))}
    </div>
  );
}
