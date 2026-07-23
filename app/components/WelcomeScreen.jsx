'use client';
import { haptic } from '../lib/haptics';

export default function WelcomeScreen({ onDismiss }) {
  return (
    <div className="overlay">
      <div className="picker-card welcome-card">
        <div className="welcome-emoji">🚐</div>
        <h1>Bienvenue dans Wouchi</h1>
        <p>
          Réserve le van, suis son entretien, et retrouve tout ce qu&apos;il faut savoir avant de partir —
          le tout partagé avec toute la famille.
        </p>
        <button
          className="btn primary welcome-start-btn"
          onClick={() => { haptic.success(); onDismiss(); }}
        >
          Let&apos;s go
        </button>
      </div>
    </div>
  );
}
