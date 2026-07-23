'use client';
import { useEffect, useRef, useState } from 'react';
import { haptic } from '../lib/haptics';

export default function HeaderMenu({ items }) {
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
    <div className="header-menu-wrap" ref={ref}>
      <button
        className="btn small"
        aria-label="Plus d'actions"
        title="Plus d'actions"
        onClick={() => { haptic.tap(); setOpen((o) => !o); }}
      >
        ⋯
      </button>

      {open && (
        <div className="header-menu-panel">
          {items.map((item) => (
            <button
              key={item.label}
              className="header-menu-item"
              onClick={() => { haptic.tap(); setOpen(false); item.onClick(); }}
            >
              <span className="header-menu-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
