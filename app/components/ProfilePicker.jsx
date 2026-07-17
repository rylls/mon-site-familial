'use client';
import Avatar from './Avatar';

export default function ProfilePicker({ members, onChoose }) {
  return (
    <div className="overlay">
      <div className="picker-card">
        <h1 className="hand">Qui es-tu ?</h1>
        <p>Choisis ton profil pour retrouver le van.</p>
        <div className="picker-grid">
          {members.map((m) => (
            <div key={m.id} className="picker-item" onClick={() => onChoose(m.id)}>
              <Avatar member={m} size="lg" />
              <span className="name">{m.name}</span>
              <span className="role">{m.role === 'parent' ? 'parent' : 'enfant'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
