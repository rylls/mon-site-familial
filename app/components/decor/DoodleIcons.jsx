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
