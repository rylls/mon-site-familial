export default function Loading() {
  return (
    <div>
      <div className="mountains-band" aria-hidden="true" />
      <div className="top-header">
        <div className="top-header-inner">
          <div className="brand">
            <h1>Wouchi</h1>
            <p>Interface de réservation</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="banner banner-none" style={{ background: 'var(--card-soft)' }}>
          <div className="skeleton skeleton-line" style={{ width: '70%', height: '18px' }} />
        </div>

        <div className="home-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-card">
              <div className="skeleton skeleton-line" style={{ width: '55%', height: '13px', marginBottom: '14px' }} />
              <div className="skeleton skeleton-line" style={{ width: '40%', height: '22px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
