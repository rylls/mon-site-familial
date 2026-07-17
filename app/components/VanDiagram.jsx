'use client';
import { ZONES } from './zones';

export default function VanDiagram({ selectedZone, onSelectZone }) {
  return (
    <div className="van-diagram-card">
      <div className="van-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/van-cutaway.png" alt="Schéma en coupe du van Wouchi" />
        {ZONES.map((z) => (
          <div
            key={z.id}
            className={`van-zone${selectedZone === z.id ? ' selected' : ''}`}
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
            onClick={() => onSelectZone(z.id)}
          >
            {selectedZone === z.id && <span className="van-zone-label">{z.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
