'use client';
import { useState } from 'react';
import Avatar from './Avatar';
import { LightbulbIcon } from './decor/DoodleIcons';
import { addIdea, validateIdea, deleteIdea } from '../actions';
import { haptic } from '../lib/haptics';

export default function IdeaBox({ ideas, onIdeasChange, members, currentMember }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const canModerate = currentMember?.id === 'vincent';

  const pending = ideas.filter((i) => i.status !== 'validated');
  const validated = ideas.filter((i) => i.status === 'validated');

  async function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed || !currentMember) return;
    setSaving(true);
    haptic.tap();
    const updated = await addIdea({ member_id: currentMember.id, text: trimmed });
    onIdeasChange(updated);
    setText('');
    setSaving(false);
  }

  async function handleValidate(id) {
    haptic.success();
    onIdeasChange(await validateIdea(id));
  }

  async function handleDelete(id) {
    haptic.tap();
    onIdeasChange(await deleteIdea(id));
  }

  function renderIdea(idea) {
    const author = memberById[idea.member_id];
    return (
      <div key={idea.id} className={`idea-item${idea.status === 'validated' ? ' validated' : ''}`}>
        <Avatar member={author} size="xs" />
        <div className="idea-item-body">
          <div className="idea-item-text">{idea.text}</div>
          <div className="idea-item-meta">{author?.name}</div>
        </div>
        {canModerate && (
          <div className="idea-item-actions">
            {idea.status !== 'validated' && (
              <button className="btn small" title="Valider" onClick={() => handleValidate(idea.id)}>✅</button>
            )}
            <button className="btn small danger" title="Supprimer" onClick={() => handleDelete(idea.id)}>🗑</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        className="idea-fab"
        aria-label="Boîte à idées"
        title="Boîte à idées"
        onClick={() => { haptic.tap(); setOpen(true); }}
      >
        <LightbulbIcon size={28} />
        {pending.length > 0 && <span className="idea-fab-count">{pending.length}</span>}
      </button>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="idea-card" onClick={(e) => e.stopPropagation()}>
            <h1>💡 Boîte à idées</h1>
            <p>Une idée pour le van, un voyage, une amélioration de l'appli ? Note-la ici, visible par toute la famille.</p>

            <div className="idea-add">
              <textarea
                rows={2}
                placeholder="Ton idée..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="btn primary small" onClick={handleAdd} disabled={saving || !text.trim()}>
                {saving ? '…' : 'Ajouter'}
              </button>
            </div>

            {ideas.length === 0 && <div className="idea-empty">Aucune idée pour l'instant.</div>}

            {pending.length > 0 && (
              <div className="idea-list">
                {pending.map(renderIdea)}
              </div>
            )}

            {validated.length > 0 && (
              <>
                <div className="idea-section-title">Validées</div>
                <div className="idea-list">
                  {validated.map(renderIdea)}
                </div>
              </>
            )}

            <button className="btn" style={{ marginTop: '16px', width: '100%' }} onClick={() => setOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}
