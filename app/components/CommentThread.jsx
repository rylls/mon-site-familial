'use client';
import { useState } from 'react';
import { addComment, deleteComment } from '../actions';
import Avatar from './Avatar';
import { haptic } from '../lib/haptics';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function CommentThread({ targetType, targetId, comments, members, currentMember, onCommentsChange }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));

  const thread = comments
    .filter((c) => c.target_type === targetType && c.target_id === targetId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  async function handleAdd() {
    if (!text.trim() || !currentMember) return;
    haptic.success();
    const updated = await addComment({ target_type: targetType, target_id: targetId, member_id: currentMember.id, text: text.trim() });
    onCommentsChange(updated);
    setText('');
  }

  async function handleDelete(id) {
    haptic.delete();
    const updated = await deleteComment(id);
    onCommentsChange(updated);
  }

  return (
    <div className="comment-thread">
      <button className="comment-toggle" onClick={() => { haptic.tap(); setOpen((o) => !o); }}>
        <span className="comment-icon">💬</span>
        {thread.length > 0 ? `${thread.length} commentaire${thread.length > 1 ? 's' : ''}` : 'Commenter'}
        {thread.length > 0 && (
          <span className="comment-avatars">
            {thread.slice(-3).map((c) => (
              <Avatar key={c.id} member={memberById[c.member_id]} size="xs" />
            ))}
          </span>
        )}
      </button>

      {open && (
        <div className="comment-panel">
          {thread.map((c) => (
            <div key={c.id} className="comment-row">
              <Avatar member={memberById[c.member_id]} size="sm" />
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{memberById[c.member_id]?.name}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
              {currentMember?.id === c.member_id && (
                <button className="comment-del" aria-label="Supprimer" onClick={() => handleDelete(c.id)}>✕</button>
              )}
            </div>
          ))}
          <div className="comment-input-row">
            {currentMember && <Avatar member={currentMember} size="sm" />}
            <input
              type="text"
              placeholder="Ajouter un commentaire…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <button className="comment-send" onClick={handleAdd} disabled={!text.trim()}>Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}
