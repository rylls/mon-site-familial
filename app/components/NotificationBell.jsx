'use client';
import { useEffect, useRef, useState } from 'react';
import { haptic } from '../lib/haptics';

export default function NotificationBell({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="btn small notif-bell"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => { haptic.tap(); setOpen((o) => !o); }}
      >
        🔔
        {items.length > 0 && <span className="notif-count">{items.length}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-title">Notifications</div>
          {items.length === 0 ? (
            <div className="notif-empty">Rien à signaler pour l'instant.</div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="notif-item">
                <span className="notif-item-icon">{n.icon}</span>
                <div className="notif-item-body">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-text">{n.body}</div>
                  {n.actionLabel && (
                    <button
                      className="btn small primary notif-item-action"
                      onClick={() => { haptic.tap(); setOpen(false); n.onAction?.(); }}
                    >
                      {n.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
