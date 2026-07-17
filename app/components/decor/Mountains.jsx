export default function Mountains() {
  return (
    <div className="mountains-band" aria-hidden="true">
      <svg viewBox="0 0 800 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="700" cy="34" r="22" fill="#E0A83E" opacity="0.5" />
        <path
          d="M0 108 L90 42 L150 84 L230 18 L310 96 L380 48 L460 100 L540 30 L620 88 L700 52 L800 100 L800 130 L0 130 Z"
          fill="#5E84A6"
          opacity="0.32"
        />
        <path
          d="M0 118 L70 74 L140 106 L210 58 L300 112 L370 68 L450 114 L530 62 L610 106 L690 70 L800 114 L800 130 L0 130 Z"
          fill="#6E8F57"
          opacity="0.4"
        />
        {/* petits sapins doodle sur la crête avant */}
        {[60, 150, 260, 420, 560, 690].map((x, i) => (
          <g key={i} transform={`translate(${x} ${112 - (i % 2) * 6})`} opacity="0.55">
            <path d="M0 0 L-7 12 L7 12 Z" fill="#3B2B1D" />
            <path d="M0 6 L-9 18 L9 18 Z" fill="#3B2B1D" />
            <rect x="-1.5" y="18" width="3" height="5" fill="#3B2B1D" />
          </g>
        ))}
      </svg>
    </div>
  );
}
