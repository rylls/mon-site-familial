'use client';
import { useState } from 'react';
import { updateMember } from '../actions';
import Avatar from './Avatar';

const PRESET_COLORS = ['#C67853', '#7A93A6', '#E3A83B', '#5B7B62', '#C1622D', '#6E8F57', '#5E84A6', '#9B6B9E'];

export default function MemberSettings({ members, onMembersChange, onClose }) {
  const [drafts, setDrafts] = useState(Object.fromEntries(members.map((m) => [m.id, { name: m.name, color: m.color }])));
  const [savingId, setSavingId] = useState(null);

  function updateDraft(id, patch) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSave(id) {
    const draft = drafts[id];
    if (!draft.name.trim()) return;
    setSavingId(id);
    const updated = await updateMember(id, { name: draft.name.trim(), color: draft.color });
    onMembersChange(updated);
    setSavingId(null);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <h1>Réglages de la famille</h1>
        <p>Modifie le nom ou la couleur de chaque profil.</p>
        {members.map((m) => {
          const draft = drafts[m.id];
          const dirty = draft.name !== m.name || draft.color !== m.color;
          return (
            <div key={m.id} className="settings-row">
              <Avatar member={{ ...m, color: draft.color }} />
              <input
                type="text"
                value={draft.name}
                onChange={(e) => updateDraft(m.id, { name: e.target.value })}
              />
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
              <button className="btn small primary" disabled={!dirty || savingId === m.id} onClick={() => handleSave(m.id)}>
                {savingId === m.id ? '…' : 'Enregistrer'}
              </button>
            </div>
          );
        })}
        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }} onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
