'use client';
import { useState } from 'react';
import { updateMember, addMember, deleteMember } from '../actions';
import Avatar from './Avatar';
import { haptic } from '../lib/haptics';

const PRESET_COLORS = ['#C67853', '#7A93A6', '#E3A83B', '#5B7B62', '#C1622D', '#6E8F57', '#5E84A6', '#9B6B9E'];

export default function MemberSettings({ members, onMembersChange, onBookingsChange, onCommentsChange, onClose }) {
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [newMember, setNewMember] = useState({ name: '', role: 'enfant', color: PRESET_COLORS[0] });
  const [adding, setAdding] = useState(false);

  function updateDraft(id, patch) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSave(id) {
    const draft = drafts[id];
    if (!draft || !draft.name.trim()) return;
    haptic.success();
    setSavingId(id);
    const updated = await updateMember(id, { name: draft.name.trim(), color: draft.color, role: draft.role });
    onMembersChange(updated);
    setSavingId(null);
  }

  async function handleDelete(id, name) {
    if (!confirm(`Supprimer le profil "${name}" ? Ses réservations et commentaires seront aussi supprimés.`)) return;
    haptic.delete();
    setDeletingId(id);
    try {
      const { members: updatedMembers, bookings, comments } = await deleteMember(id);
      onMembersChange(updatedMembers);
      onBookingsChange?.(bookings);
      onCommentsChange?.(comments);
    } catch (e) {
      alert('Impossible de supprimer ce profil.');
    }
    setDeletingId(null);
  }

  async function handleAdd() {
    if (!newMember.name.trim()) return;
    haptic.success();
    setAdding(true);
    try {
      const updated = await addMember({ name: newMember.name.trim(), role: newMember.role, color: newMember.color });
      onMembersChange(updated);
      setNewMember({ name: '', role: 'enfant', color: PRESET_COLORS[0] });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <h1>Réglages de la famille</h1>
        <p>Modifie le nom, le rôle ou la couleur de chaque profil.</p>
        {members.map((m) => {
          const draft = drafts[m.id] || { name: m.name, color: m.color, role: m.role };
          const dirty = draft.name !== m.name || draft.color !== m.color || draft.role !== m.role;
          return (
            <div key={m.id} className="settings-row">
              <Avatar member={{ ...m, color: draft.color }} />
              <input
                type="text"
                value={draft.name}
                onChange={(e) => updateDraft(m.id, { name: e.target.value })}
              />
              <div className="settings-role-toggle">
                <button
                  className={`settings-role-btn${draft.role === 'parent' ? ' active' : ''}`}
                  onClick={() => updateDraft(m.id, { role: 'parent' })}
                >
                  Parent
                </button>
                <button
                  className={`settings-role-btn${draft.role === 'enfant' ? ' active' : ''}`}
                  onClick={() => updateDraft(m.id, { role: 'enfant' })}
                >
                  Enfant
                </button>
              </div>
              <div className="settings-colors">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`settings-swatch${draft.color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    aria-label={c}
                    onClick={() => updateDraft(m.id, { color: c })}
                  />
                ))}
              </div>
              <div className="settings-row-actions">
                <button className="btn small primary" disabled={!dirty || savingId === m.id} onClick={() => handleSave(m.id)}>
                  {savingId === m.id ? '…' : 'Enregistrer'}
                </button>
                <button
                  className="btn small"
                  disabled={deletingId === m.id}
                  onClick={() => handleDelete(m.id, m.name)}
                  aria-label={`Supprimer ${m.name}`}
                >
                  {deletingId === m.id ? '…' : '🗑'}
                </button>
              </div>
            </div>
          );
        })}

        <div className="settings-row settings-row-new">
          <Avatar member={{ name: newMember.name || '?', color: newMember.color }} />
          <input
            type="text"
            placeholder="Nouveau profil…"
            value={newMember.name}
            onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
          />
          <div className="settings-role-toggle">
            <button
              className={`settings-role-btn${newMember.role === 'parent' ? ' active' : ''}`}
              onClick={() => setNewMember((p) => ({ ...p, role: 'parent' }))}
            >
              Parent
            </button>
            <button
              className={`settings-role-btn${newMember.role === 'enfant' ? ' active' : ''}`}
              onClick={() => setNewMember((p) => ({ ...p, role: 'enfant' }))}
            >
              Enfant
            </button>
          </div>
          <div className="settings-colors">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`settings-swatch${newMember.color === c ? ' selected' : ''}`}
                style={{ background: c }}
                aria-label={c}
                onClick={() => setNewMember((p) => ({ ...p, color: c }))}
              />
            ))}
          </div>
          <button className="btn small primary" disabled={!newMember.name.trim() || adding} onClick={handleAdd}>
            {adding ? '…' : '+ Ajouter'}
          </button>
        </div>

        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }} onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
