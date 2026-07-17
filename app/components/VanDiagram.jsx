'use client';
import { ZONES } from './zones';

export default function VanDiagram({ selectedZone, onSelectZone }) {
  return (
    <div className="van-diagram-card">
      <svg className="van-svg-wrap" viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">
        {/* ombre au sol */}
        <ellipse cx="335" cy="272" rx="270" ry="8" fill="#2b2b2b" opacity="0.08" />

        {/* carrosserie T5 California, profil doodle */}
        <path
          d="M70,255 L70,140 Q70,108 96,103 L120,74 Q130,64 145,64 L558,64 Q580,64 580,86 L580,255 Z"
          fill="#F2EEE3"
          stroke="#2B2B2B"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* liseré bas deux-tons */}
        <path d="M70,225 L580,225 L580,255 L70,255 Z" fill="#D97757" fillOpacity="0.16" stroke="none" />
        <line x1="70" y1="225" x2="580" y2="225" stroke="#2B2B2B" strokeWidth="2" />

        {/* toit relevable California */}
        <path
          d="M232,64 L232,26 Q232,20 238,20 L420,20 Q426,20 426,26 L426,64"
          fill="#FBFAF6"
          stroke="#2B2B2B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="248" y1="34" x2="266" y2="52" stroke="#2B2B2B" strokeWidth="1.3" opacity="0.35" />
        <line x1="278" y1="30" x2="296" y2="52" stroke="#2B2B2B" strokeWidth="1.3" opacity="0.35" />
        <line x1="308" y1="30" x2="326" y2="52" stroke="#2B2B2B" strokeWidth="1.3" opacity="0.35" />

        {/* pare-brise */}
        <path d="M99,101 L121,76 Q129,67 143,66 L143,101 Z" fill="#CFE1EA" stroke="#2B2B2B" strokeWidth="2" strokeLinejoin="round" />
        {/* rétroviseur */}
        <path d="M118,88 Q108,86 106,94 Q108,100 116,98" fill="#F2EEE3" stroke="#2B2B2B" strokeWidth="1.8" />

        {/* vitres laterales */}
        <rect x="163" y="83" width="150" height="40" rx="6" fill="#CFE1EA" stroke="#2B2B2B" strokeWidth="2" />
        <rect x="470" y="83" width="70" height="40" rx="6" fill="#CFE1EA" stroke="#2B2B2B" strokeWidth="2" />

        {/* porte coulissante */}
        <line x1="340" y1="70" x2="340" y2="222" stroke="#2B2B2B" strokeWidth="2" opacity="0.55" />
        <rect x="330" y="148" width="6" height="18" rx="2" fill="#2B2B2B" opacity="0.6" />

        {/* portes arriere */}
        <line x1="575" y1="88" x2="575" y2="222" stroke="#2B2B2B" strokeWidth="2" opacity="0.55" />
        <rect x="568" y="150" width="5" height="16" rx="2" fill="#2B2B2B" opacity="0.6" />

        {/* insigne avant */}
        <circle cx="103" cy="112" r="8" fill="#FBFAF6" stroke="#2B2B2B" strokeWidth="2" />
        <line x1="98" y1="112" x2="108" y2="112" stroke="#2B2B2B" strokeWidth="1.3" />
        <line x1="103" y1="107" x2="103" y2="117" stroke="#2B2B2B" strokeWidth="1.3" />
        {/* phare */}
        <ellipse cx="82" cy="152" rx="7" ry="9" fill="#F3D67A" stroke="#2B2B2B" strokeWidth="1.8" />
        {/* feu arriere */}
        <rect x="574" y="170" width="7" height="20" rx="3" fill="#D97757" stroke="#2B2B2B" strokeWidth="1.5" />

        {/* roues */}
        <circle cx="185" cy="255" r="30" fill="#2B2B2B" />
        <circle cx="185" cy="255" r="12" fill="#F2EEE3" stroke="#2B2B2B" strokeWidth="1.5" />
        <circle cx="480" cy="255" r="30" fill="#2B2B2B" />
        <circle cx="480" cy="255" r="12" fill="#F2EEE3" stroke="#2B2B2B" strokeWidth="1.5" />
        {[0, 72, 144, 216, 288].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <g key={deg}>
              <line x1="185" y1="255" x2={185 + 10 * Math.cos(rad)} y2={255 + 10 * Math.sin(rad)} stroke="#2B2B2B" strokeWidth="1.3" />
              <line x1="480" y1="255" x2={480 + 10 * Math.cos(rad)} y2={255 + 10 * Math.sin(rad)} stroke="#2B2B2B" strokeWidth="1.3" />
            </g>
          );
        })}

        {/* Zones cliquables */}
        {ZONES.map((z) => (
          <g
            key={z.id}
            className={`van-zone${selectedZone === z.id ? ' selected' : ''}`}
            onClick={() => onSelectZone(z.id)}
          >
            <rect
              x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
              fill={selectedZone === z.id ? '#0A84FF' : '#ffffff'}
              fillOpacity={selectedZone === z.id ? 0.16 : 0.001}
              stroke={selectedZone === z.id ? '#0A84FF' : '#8A7D6B'}
              strokeWidth={selectedZone === z.id ? 2.5 : 1.3}
              strokeDasharray="5 4"
            />
            <text
              x={z.x + 6}
              y={z.y + z.h / 2 + 4}
              textAnchor="start"
              className="doodle"
              fontSize="12"
              fill="#2B2B2B"
            >
              {z.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
