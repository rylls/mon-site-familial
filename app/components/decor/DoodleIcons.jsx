export function PineTreeIcon({ size = 18, color = '#6E8F57' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L5 12 H9 L4 19 H20 L15 12 H19 Z" fill={color} stroke="#3B2B1D" strokeWidth="1" strokeLinejoin="round" />
      <rect x="10.5" y="19" width="3" height="3.5" fill="#3B2B1D" />
    </svg>
  );
}

export function MiniVanIcon({ size = 16, color = '#fff' }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 16 L2 8 Q2 6 4 5.5 L7 2 Q8 1 9.5 1 L21 1 Q23.5 1 24 3.5 L25.5 8 Q26 10 25.5 13 L25.5 16 Z"
        fill={color}
        stroke="#3B2B1D"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 4 L9.5 2.3 L13 2.3 L13 8 L5 8 Z" fill="#CFE1EA" stroke="#3B2B1D" strokeWidth="0.9" />
      <circle cx="8" cy="16.5" r="2.6" fill="#3B2B1D" />
      <circle cx="20" cy="16.5" r="2.6" fill="#3B2B1D" />
    </svg>
  );
}

export function CompassIcon({ size = 18, color = '#C1622D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.6" fill="none" />
      <path d="M12 6 L14 12 L12 18 L10 12 Z" fill={color} />
    </svg>
  );
}

export function LanternIcon({ size = 16, color = '#E0A83E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="7" width="8" height="10" rx="2" fill={color} stroke="#3B2B1D" strokeWidth="1.2" />
      <path d="M10 3 H14 L13 7 H11 Z" fill="#3B2B1D" />
      <path d="M9 20 H15" stroke="#3B2B1D" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="#FFF6DE" />
    </svg>
  );
}

export function TicketPathIcon({ size = 18, color = '#5E84A6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18 Q8 10 12 18 T21 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1 4.5" fill="none" />
      <circle cx="3" cy="18" r="1.6" fill={color} />
      <circle cx="21" cy="8" r="1.6" fill={color} />
    </svg>
  );
}

export function SunIcon({ size = 24, color = '#E0A83E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5" fill={color} stroke="#3B2B1D" strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 12 + 8 * Math.cos(r), y1 = 12 + 8 * Math.sin(r);
        const x2 = 12 + 10.5 * Math.cos(r), y2 = 12 + 10.5 * Math.sin(r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.6" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function TentIcon({ size = 22, color = '#C1622D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3 L21 20 H3 Z" fill={color} stroke="#3B2B1D" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 3 L12 20" stroke="#3B2B1D" strokeWidth="1" />
      <path d="M9 20 L12 12 L15 20" fill="#FBF2DE" stroke="#3B2B1D" strokeWidth="1" />
    </svg>
  );
}

export function BookIcon({ size = 22, color = '#5E84A6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4 Q8 2 12 4 V19 Q8 17 4 19 Z" fill={color} stroke="#3B2B1D" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M20 4 Q16 2 12 4 V19 Q16 17 20 19 Z" fill={color} opacity="0.75" stroke="#3B2B1D" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

export function WrenchIcon({ size = 22, color = '#8A6F4E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.5 3.5 A5 5 0 0 0 9 9.5 L3 15.5 L5.5 18 L11.5 12 A5 5 0 0 0 17.5 5.5 L14.5 8.5 L12.5 6.5 Z"
        fill={color}
        stroke="#3B2B1D"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GearIcon({ size = 20, color = '#8A6F4E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" fill="none" stroke={color} strokeWidth="1.8" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 12 + 6.5 * Math.cos(r), y1 = 12 + 6.5 * Math.sin(r);
        const x2 = 12 + 9.5 * Math.cos(r), y2 = 12 + 9.5 * Math.sin(r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function OilCanIcon({ size = 20, color = '#3B2B1D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9 H15 L15 20 Q15 21 14 21 H7 Q6 21 6 20 Z" fill={color} stroke="#3B2B1D" strokeWidth="1" strokeLinejoin="round" />
      <path d="M15 11 L20 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 9 L8 6 Q8 5 9 5 H11 Q12 5 12 6 V9" stroke="#3B2B1D" strokeWidth="1" fill="none" />
    </svg>
  );
}
