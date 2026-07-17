'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Mot de passe incorrect.');
    }
  }

  return (
    <div className="overlay">
      <div className="gate">
        <div className="plate">
          <h1 className="hand">Wouchi</h1>
          <p className="sub">le van de la famille — entre le mot de passe pour accéder au site.</p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
            />
            {error && <div className="error-msg">{error}</div>}
            <button className="btn primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
              Entrer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
