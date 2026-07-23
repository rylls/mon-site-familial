'use client';

export default function Error({ error, reset }) {
  return (
    <div className="wrap" style={{ paddingTop: '80px', textAlign: 'center' }}>
      <div className="home-card" style={{ maxWidth: '440px', margin: '0 auto' }}>
        <div style={{ fontSize: '40px', marginBottom: '4px' }}>🚐💨</div>
        <div className="home-card-title" style={{ justifyContent: 'center' }}>Un imprévu sur la route</div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '14px', margin: '4px 0 18px' }}>
          Quelque chose s&apos;est mal passé en chargeant cette page. Réessaie, ou reviens dans un instant.
        </p>
        <button className="btn small primary" onClick={() => reset()}>Réessayer</button>
      </div>
    </div>
  );
}
