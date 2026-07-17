'use client';
import { ZONES } from './zones';

export default function VanDiagram({ selectedZone, onSelectZone }) {
  return (
    <div className="van-diagram-card">
      <svg className="van-svg-wrap" viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="180" cy="238" rx="34" ry="6" fill="#3E362E" opacity="0.08" />
        <ellipse cx="470" cy="238" rx="34" ry="6" fill="#3E362E" opacity="0.08" />

        {/* Carrosserie du van, style doodle gris T5 */}
        <path
          d="M60 220 L60 110 Q60 90 82 88 L110 60 Q120 50 135 50 L560 50 Q585 50 590 78 L598 150 Q600 170 598 190 L598 220 Z"
          fill="#E7E3DA"
          stroke="#3E362E"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* toit relevable */}
        <path d="M135 50 L150 20 L470 20 L500 50 Z" fill="#F3EFE6" stroke="#3E362E" strokeWidth="2.5" strokeLinejoin="round" />
        {/* pare-brise */}
        <path d="M60 150 L60 110 Q60 90 82 88 L108 62 L118 150 Z" fill="#CFE1E8" stroke="#3E362E" strokeWidth="2" />
        {/* roues */}
        <circle cx="180" cy="222" r="26" fill="#3E362E" />
        <circle cx="180" cy="222" r="10" fill="#E7E3DA" />
        <circle cx="470" cy="222" r="26" fill="#3E362E" />
        <circle cx="470" cy="222" r="10" fill="#E7E3DA" />

        {/* Zones cliquables */}
        {ZONES.map((z) => (
          <g
            key={z.id}
            className={`van-zone${selectedZone === z.id ? ' selected' : ''}`}
            onClick={() => onSelectZone(z.id)}
          >
            <rect
              x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
              fill={selectedZone === z.id ? '#E3A83B' : '#ffffff'}
              fillOpacity={selectedZone === z.id ? 0.35 : 0.001}
              stroke={selectedZone === z.id ? '#C67853' : '#8A7D6B'}
              strokeWidth={selectedZone === z.id ? 2.5 : 1.5}
              strokeDasharray="5 4"
            />
            <text
              x={z.x + z.w / 2}
              y={z.y + z.h / 2 + 4}
              textAnchor="middle"
              fontFamily="Patrick Hand, cursive"
              fontSize="13"
              fill="#3E362E"
            >
              {z.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
