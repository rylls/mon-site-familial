'use client';
import Image from 'next/image';
import { ZONES } from './zones';

export default function VanDiagram({ selectedZone, onSelectZone }) {
  return (
    <div className="van-diagram-card">
      <div className="van-image-wrap">
        <Image src="/images/van-cutaway.png" alt="Schéma en coupe du van Wouchi" width={1600} height={873} />
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
