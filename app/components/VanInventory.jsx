'use client';
import { useState } from 'react';
import { updateInventoryLevel, addInventoryItem, deleteInventoryItem, bulkFillZone } from '../actions';
import { ZONES, ZONE_LABELS } from './zones';
import VanDiagram from './VanDiagram';
import CommentThread from './CommentThread';
import { haptic } from '../lib/haptics';

const LEVELS = ['vide', 'partiel', 'plein'];
const LEVEL_TEXT = { vide: 'vide', partiel: 'partiel', plein: 'plein' };

export default function VanInventory({ items, onItemsChange, comments, onCommentsChange, members, currentMember }) {
  const [zone, setZone] = useState(ZONES[0].id);
  const [newName, setNewName] = useState('');
  const [filling, setFilling] = useState(false);

  const zoneItems = items.filter((i) => i.zone === zone);
  const zoneNotFull = zoneItems.filter((i) => i.level !== 'plein').length;

  async function setLevel(id, level) {
    haptic.tap();
    onItemsChange(items.map((i) => (i.id === id ? { ...i, level } : i)));
    await updateInventoryLevel(id, level, currentMember?.id);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    haptic.success();
    const updated = await addInventoryItem({ zone, name: newName.trim() });
    onItemsChange(updated);
    setNewName('');
  }

  async function handleDelete(id) {
    haptic.delete();
    const updated = await deleteInventoryItem(id);
    onItemsChange(updated);
  }

  async function handleFillZone() {
    haptic.success();
    setFilling(true);
    const updated = await bulkFillZone(zone, currentMember?.id);
    onItemsChange(updated);
    setFilling(false);
  }

  return (
    <div>
      <VanDiagram selectedZone={zone} onSelectZone={setZone} />

      <div className="zone-tabs">
        {ZONES.map((z) => {
          const count = items.filter((i) => i.zone === z.id && i.level !== 'plein').length;
          return (
            <button key={z.id} className={`zone-tab${zone === z.id ? ' active' : ''}`} onClick={() => { haptic.tap(); setZone(z.id); }}>
              {z.label}
              {count > 0 && <span className="zone-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="section-title-row">
        <h2 className="section-title">{ZONE_LABELS[zone]}</h2>
        {zoneNotFull > 0 && (
          <button className="btn small" onClick={handleFillZone} disabled={filling}>
            {filling ? '…' : 'Tout remplir'}
          </button>
        )}
      </div>

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
