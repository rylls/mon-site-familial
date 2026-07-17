'use client';
import { useState } from 'react';
import { addMileageLog, updateMaintenanceItem, markMaintenanceDone, addMaintenanceItem, deleteMaintenanceItem } from '../actions';
import { getMaintenanceStatus, STATUS_LABELS, STATUS_ORDER } from '../lib/maintenance';
import { haptic } from '../lib/haptics';

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtKm(km) {
  if (km == null) return null;
  return `${km.toLocaleString('fr-FR')} km`;
}

export default function MaintenanceView({ mileageLogs, onMileageLogsChange, maintenanceItems, onMaintenanceItemsChange, currentMember }) {
  const [newKm, setNewKm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', interval_km: '', interval_months: '', notes: '' });

  const currentKm = mileageLogs[0]?.km ?? null;
  const currentKmDate = mileageLogs[0]?.recorded_at ?? null;

  const rows = maintenanceItems
    .map((item) => ({ item, ...getMaintenanceStatus(item, currentKm) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  async function handleAddKm() {
    const km = parseInt(newKm, 10);
    if (!km || km <= 0) return;
    haptic.success();
    const updated = await addMileageLog({ km, recorded_by: currentMember?.id });
    onMileageLogsChange(updated);
    setNewKm('');
  }

  function startEdit(item) {
    haptic.tap();
    setEditingId(item.id);
    setDraft({
      interval_km: item.interval_km ?? '',
      interval_months: item.interval_months ?? '',
      last_done_km: item.last_done_km ?? '',
      last_done_date: item.last_done_date ?? '',
      notes: item.notes ?? '',
    });
  }

  async function saveEdit(id) {
    const patch = {
      interval_km: draft.interval_km === '' ? null : parseInt(draft.interval_km, 10),
      interval_months: draft.interval_months === '' ? null : parseInt(draft.interval_months, 10),
      last_done_km: draft.last_done_km === '' ? null : parseInt(draft.last_done_km, 10),
      last_done_date: draft.last_done_date || null,
      notes: draft.notes || null,
    };
    const updated = await updateMaintenanceItem(id, patch);
    onMaintenanceItemsChange(updated);
    setEditingId(null);
    haptic.success();
  }

  async function handleMarkDone(id) {
    haptic.success();
    const updated = await markMaintenanceDone(id, { km: currentKm, date: new Date().toISOString().slice(0, 10) });
    onMaintenanceItemsChange(updated);
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce poste du plan d\'entretien ?')) return;
    haptic.delete();
    const updated = await deleteMaintenanceItem(id);
    onMaintenanceItemsChange(updated);
  }

  async function handleAddItem() {
    if (!newItem.name.trim()) return;
    haptic.success();
    const updated = await addMaintenanceItem({
      name: newItem.name.trim(),
      interval_km: newItem.interval_km ? parseInt(newItem.interval_km, 10) : null,
      interval_months: newItem.interval_months ? parseInt(newItem.interval_months, 10) : null,
      notes: newItem.notes || null,
    });
    onMaintenanceItemsChange(updated);
    setNewItem({ name: '', interval_km: '', interval_months: '', notes: '' });
    setAddingNew(false);
  }

  return (
    <div>
      <div className="maintenance-disclaimer">
        🔧 Intervalles généraux pour un TDI de cette génération, pas une donnée certifiée pour ce véhicule précis. En cas de doute — surtout pour la distribution — fais vérifier par un professionnel.
      </div>

      <div className="mileage-card">
        <div>
          <div className="mileage-label">Kilométrage actuel</div>
          <div className="mileage-value">{currentKm != null ? fmtKm(currentKm) : 'Non renseigné'}</div>
          {currentKmDate && <div className="mileage-date">relevé le {fmtDate(currentKmDate)}</div>}
        </div>
        <div className="mileage-add">
          <input
            type="number"
            placeholder="Nouveau km"
            value={newKm}
            onChange={(e) => setNewKm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddKm(); }}
          />
          <button className="btn primary" onClick={handleAddKm} disabled={!newKm}>Ajouter un relevé</button>
        </div>
      </div>

      <div className="section-title-row">
        <h2 className="section-title"><span>🔧</span> Plan d'entretien</h2>
        <button className="btn small" onClick={() => { haptic.tap(); setAddingNew((v) => !v); }}>
          {addingNew ? 'Annuler' : '+ Ajouter un poste'}
        </button>
      </div>

      {addingNew && (
        <div className="maint-card maint-new">
          <input type="text" placeholder="Nom du poste (ex: Essuie-glaces)" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <div className="row2">
            <input type="number" placeholder="Intervalle (km, optionnel)" value={newItem.interval_km} onChange={(e) => setNewItem({ ...newItem, interval_km: e.target.value })} />
            <input type="number" placeholder="Intervalle (mois, optionnel)" value={newItem.interval_months} onChange={(e) => setNewItem({ ...newItem, interval_months: e.target.value })} />
          </div>
          <input type="text" placeholder="Notes (optionnel)" value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })} />
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAddItem} disabled={!newItem.name.trim()}>
            Ajouter au plan
          </button>
        </div>
      )}

      {rows.map(({ item, status, dueKm, dueDate, kmLeft, daysLeft }) => (
        <div key={item.id} className={`maint-card status-${status}`}>
          <div className="maint-top">
            <div className="maint-name">{item.name}</div>
            <span className={`maint-badge badge-${status}`}>{STATUS_LABELS[status]}</span>
          </div>

          <div className="maint-details">
            <div>
              Dernier : {item.last_done_km != null || item.last_done_date
                ? [item.last_done_km != null ? fmtKm(item.last_done_km) : null, item.last_done_date ? fmtDate(item.last_done_date) : null].filter(Boolean).join(' · ')
                : 'inconnu'}
            </div>
            {(dueKm != null || dueDate) && (
              <div>
                Prochain : {[dueKm != null ? fmtKm(dueKm) : null, dueDate ? fmtDate(dueDate) : null].filter(Boolean).join(' · ')}
                {kmLeft != null && ` (${kmLeft > 0 ? `dans ${fmtKm(kmLeft)}` : `dépassé de ${fmtKm(-kmLeft)}`})`}
                {daysLeft != null && ` (${daysLeft > 0 ? `dans ${daysLeft} j` : `dépassé de ${-daysLeft} j`})`}
              </div>
            )}
            {item.notes && <div className="maint-notes">{item.notes}</div>}
          </div>

          {editingId === item.id ? (
            <div className="maint-edit">
              <div className="row2">
                <input type="number" placeholder="Intervalle (km)" value={draft.interval_km} onChange={(e) => setDraft({ ...draft, interval_km: e.target.value })} />
                <input type="number" placeholder="Intervalle (mois)" value={draft.interval_months} onChange={(e) => setDraft({ ...draft, interval_months: e.target.value })} />
              </div>
              <div className="row2">
                <input type="number" placeholder="Dernier km" value={draft.last_done_km} onChange={(e) => setDraft({ ...draft, last_done_km: e.target.value })} />
                <input type="date" value={draft.last_done_date} onChange={(e) => setDraft({ ...draft, last_done_date: e.target.value })} />
              </div>
              <input type="text" placeholder="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => setEditingId(null)}>Annuler</button>
                <button className="btn primary" style={{ flex: 1 }} onClick={() => saveEdit(item.id)}>Enregistrer</button>
              </div>
            </div>
          ) : (
            <div className="maint-actions">
              <button className="btn small" onClick={() => handleMarkDone(item.id)} disabled={currentKm == null}>Fait aujourd'hui</button>
              <button className="btn small" onClick={() => startEdit(item)}>Modifier</button>
              <button className="btn small danger" onClick={() => handleDelete(item.id)}>Supprimer</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
