export default function Mountains() {
  return (
    <div className="mountains-band" aria-hidden="true">
      <svg viewBox="0 0 800 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="690" cy="30" r="20" fill="#E3A83B" opacity="0.55" />
        <path
          d="M0 100 L90 40 L150 80 L230 20 L310 90 L380 45 L460 95 L540 30 L620 85 L700 50 L800 95 L800 120 L0 120 Z"
          fill="#7A93A6"
          opacity="0.35"
        />
        <path
          d="M0 110 L70 70 L140 100 L210 55 L300 105 L370 65 L450 108 L530 60 L610 100 L690 68 L800 108 L800 120 L0 120 Z"
          fill="#5B7B62"
          opacity="0.4"
        />
        <path
          d="M470 95 Q485 105 500 95 L500 108 Q485 100 470 108 Z"
          fill="none"
        />
      </svg>
    </div>
  );
}
