'use client';
import { useRef, useState } from 'react';
import { haptic } from '../lib/haptics';

const THRESHOLD = 72;
const DEAD_ZONE = 10;

export default function SwipeableRow({ children, onSwipeLeft, onSwipeRight, leftLabel, rightLabel }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const firedRef = useRef(false);

  function handlePointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    activeRef.current = false;
    firedRef.current = false;
  }

  function handlePointerMove(e) {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const rawDx = e.clientX - startRef.current.x;
    const rawDy = e.clientY - startRef.current.y;

    if (!activeRef.current) {
      if (Math.abs(rawDx) < DEAD_ZONE || Math.abs(rawDx) < Math.abs(rawDy)) return;
      activeRef.current = true;
      setDragging(true);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }

    let delta = rawDx;
    if (!onSwipeLeft) delta = Math.max(delta, 0);
    if (!onSwipeRight) delta = Math.min(delta, 0);
    setDx(delta);
    if (!firedRef.current && Math.abs(delta) > THRESHOLD) {
      firedRef.current = true;
      haptic.tap();
    }
  }

  function handlePointerUp() {
    if (!activeRef.current) return;
    activeRef.current = false;
    setDragging(false);
    if (dx <= -THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    } else if (dx >= THRESHOLD && onSwipeRight) {
      onSwipeRight();
    }
    setDx(0);
  }

  const showLeft = dx < -10 && onSwipeLeft;
  const showRight = dx > 10 && onSwipeRight;

  return (
    <div className="swipe-row">
      {showLeft && (
        <div className="swipe-action swipe-action-left" style={{ opacity: Math.min(1, -dx / THRESHOLD) }}>
          {leftLabel}
        </div>
      )}
      {showRight && (
        <div className="swipe-action swipe-action-right" style={{ opacity: Math.min(1, dx / THRESHOLD) }}>
          {rightLabel}
        </div>
      )}
      <div
        className="swipe-content"
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform .2s ease' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </div>
    </div>
  );
}
