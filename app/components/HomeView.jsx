'use client';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { addImportantInfo, updateImportantInfo, deleteImportantInfo, uploadImportantInfoPhoto } from '../actions';
import { parseDate, formatRange, startOfToday, fmtDate } from '../lib/dates';
import { fetchDailyWeather, weatherEmoji } from '../lib/weather';
import { haptic } from '../lib/haptics';

function compressImage(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression échouée')); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function WeatherCard({ nextTrip }) {
  const [weather, setWeather] = useState(undefined);

  useEffect(() => {
    if (!nextTrip) { setWeather(undefined); return; }
    let cancelled = false;
    setWeather(undefined);
    fetchDailyWeather(fmtDate(parseDate(nextTrip.start_date))).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => { cancelled = true; };
  }, [nextTrip?.id]);

  if (!nextTrip || weather === null) return null;

  return (
    <div className="home-card weather-card">
      <div className="home-card-title">Météo au départ</div>
      {weather === undefined ? (
        <div className="weather-loading">…</div>
      ) : (
        <div className="weather-body">
          <span className="weather-emoji">{weatherEmoji(weather.code)}</span>
          <div>
            <div className="weather-temps">{weather.min}° / {weather.max}°</div>
            <div className="weather-date">{formatRange(nextTrip.start_date, nextTrip.start_date)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownCard({ trip, member, isActive }) {
  if (!trip) return null;
  const today = startOfToday();
  const start = parseDate(trip.start_date);
  const end = parseDate(trip.end_date);

  if (!isActive) {
    const daysLeft = Math.max(0, Math.round((start - today) / 86400000));
    return (
      <div className="home-card countdown-card">
        <div className="home-card-title">Prochain départ</div>
        <div className="countdown-label">
          {daysLeft === 0 ? 'C\'est aujourd\'hui !' : `Dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
          {member ? ` · ${member.name}` : ''}
        </div>
        <div className="countdown-track pending">
          <span className="countdown-van pending">🚐</span>
        </div>
      </div>
    );
  }

  const totalDays = Math.max(1, Math.round((end - start) / 86400000));
  const elapsed = Math.round((today - start) / 86400000);
  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const daysLeft = Math.max(0, Math.round((end - today) / 86400000));

  return (
    <div className="home-card countdown-card">
      <div className="home-card-title">Voyage en cours</div>
      <div className="countdown-label">
        {daysLeft === 0 ? 'Retour aujourd\'hui' : `Retour dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
        {member ? ` · ${member.name}` : ''}
      </div>
      <div className="countdown-track active">
        <div className="countdown-fill" style={{ width: `${progress}%`, background: member?.color }} />
        <span className="countdown-van active" style={{ left: `calc(${progress}% - 12px)` }}>🚐</span>
        <span className="countdown-flag">🏁</span>
      </div>
    </div>
  );
}

function AnecdoteCard({ pastTrip, member }) {
  if (!pastTrip || !pastTrip.note) return null;
  return (
    <div className="home-card anecdote-card">
      <div className="home-card-title">Dernier trajet</div>
      <div className="anecdote-body">
        <Avatar member={member} size="sm" />
        <div>
          <div className="anecdote-quote">« {pastTrip.note} »</div>
          <div className="anecdote-meta">{member?.name} · {formatRange(pastTrip.start_date, pastTrip.end_date)}</div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ bookings, mileageLogs, members }) {
  const year = new Date().getFullYear();
  const thisYearBookings = bookings.filter((b) => parseDate(b.start_date).getFullYear() === year);
  const nights = thisYearBookings.reduce((sum, b) => sum + Math.max(1, Math.round((parseDate(b.end_date) - parseDate(b.start_date)) / 86400000)), 0);
  const avgNights = thisYearBookings.length > 0 ? Math.round((nights / thisYearBookings.length) * 10) / 10 : 0;

  const logsThisYear = mileageLogs.filter((l) => new Date(l.recorded_at).getFullYear() === year).sort((a, b) => a.km - b.km);
  const kmThisYear = logsThisYear.length >= 2 ? logsThisYear[logsThisYear.length - 1].km - logsThisYear[0].km : null;
  const currentKm = mileageLogs[0]?.km ?? null;

  const countByMember = {};
  for (const b of thisYearBookings) countByMember[b.member_id] = (countByMember[b.member_id] || 0) + 1;
  const ranking = members
    .map((m) => ({ member: m, count: countByMember[m.id] || 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCount = ranking[0]?.count || 1;

  const today = startOfToday();
  const lastEnded = bookings
    .filter((b) => parseDate(b.end_date) < today)
    .sort((a, b) => parseDate(b.end_date) - parseDate(a.end_date))[0];
  const daysSinceLast = lastEnded ? Math.round((today - parseDate(lastEnded.end_date)) / 86400000) : null;

  return (
    <div className="home-card stats-card">
      <div className="home-card-title">Carnet de bord {year}</div>
      <div className="stats-grid">
        <div className="stat-tile">
          <div className="stat-icon">🌙</div>
          <div className="stat-value">{nights}</div>
          <div className="stat-label">nuit{nights > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">🚐</div>
          <div className="stat-value">{thisYearBookings.length}</div>
          <div className="stat-label">trajet{thisYearBookings.length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">📏</div>
          <div className="stat-value">{avgNights || '—'}</div>
          <div className="stat-label">nuits / trajet</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">🛣️</div>
          <div className="stat-value">{kmThisYear != null ? kmThisYear.toLocaleString('fr-FR') : '—'}</div>
          <div className="stat-label">km parcourus</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{currentKm != null ? currentKm.toLocaleString('fr-FR') : '—'}</div>
          <div className="stat-label">km au compteur</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{daysSinceLast != null ? daysSinceLast : '—'}</div>
          <div className="stat-label">j. depuis le dernier</div>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="stats-ranking">
          <div className="stats-ranking-title">Utilisation par membre</div>
          {ranking.map(({ member, count }) => (
            <div key={member.id} className="stats-ranking-row">
              <Avatar member={member} size="xs" />
              <span className="stats-ranking-name">{member.name}</span>
              <div className="stats-ranking-bar">
                <div className="stats-ranking-fill" style={{ width: `${(count / maxCount) * 100}%`, background: member.color }} />
              </div>
              <span className="stats-ranking-count">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImportantInfoCard({ items, onItemsChange }) {
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState({ title: '', body: '' });
  const [editingId, setEditingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  async function handleAddSave() {
    if (!newDraft.title.trim()) return;
    haptic.success();
    setSaving(true);
    try {
      const updated = await addImportantInfo({ title: newDraft.title.trim(), body: newDraft.body.trim() });
      onItemsChange(updated);
      setNewDraft({ title: '', body: '' });
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(id) {
    const d = drafts[id];
    if (!d || !d.title.trim()) return;
    haptic.success();
    setSaving(true);
    try {
      const updated = await updateImportantInfo(id, { title: d.title.trim(), body: d.body.trim() });
      onItemsChange(updated);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce bloc d\'information ?')) return;
    haptic.delete();
    const updated = await deleteImportantInfo(id);
    onItemsChange(updated);
  }

  async function handlePhoto(id, file) {
    if (!file) return;
    haptic.tap();
    setUploadingId(id);
    try {
      const compressed = await compressImage(file).catch(() => file);
      const fd = new FormData();
      fd.append('file', compressed);
      const updated = await uploadImportantInfoPhoto(id, fd);
      onItemsChange(updated);
    } catch (e) {
      alert('Impossible d\'envoyer la photo. As-tu bien lancé la migration de la base de données ?');
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="home-card info-card">
      <div className="home-card-title-row">
        <div className="home-card-title">Informations importantes</div>
        <button className="btn small" onClick={() => { haptic.tap(); setAdding((v) => !v); }}>
          {adding ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {adding && (
        <div className="info-edit-form">
          <input
            type="text"
            placeholder="Titre (ex : Comment ouvrir le toit ?)"
            value={newDraft.title}
            onChange={(e) => setNewDraft((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            placeholder="Explication…"
            value={newDraft.body}
            onChange={(e) => setNewDraft((p) => ({ ...p, body: e.target.value }))}
          />
          <button className="btn small primary" disabled={!newDraft.title.trim() || saving} onClick={handleAddSave}>
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      )}

      {items.length === 0 && !adding && (
        <div className="empty-state">Rien pour l'instant. Ajoute des infos utiles pour la famille (comment ouvrir le toit, où est la clé du gaz…).</div>
      )}

      {items.map((item) => {
        const isEditing = editingId === item.id;
        const draft = drafts[item.id] || { title: item.title, body: item.body || '' };
        return (
          <div key={item.id} className="info-block">
            {isEditing ? (
              <div className="info-edit-form">
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDrafts((p) => ({ ...p, [item.id]: { ...draft, title: e.target.value } }))}
                />
                <textarea
                  value={draft.body}
                  onChange={(e) => setDrafts((p) => ({ ...p, [item.id]: { ...draft, body: e.target.value } }))}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn small primary" disabled={saving} onClick={() => handleEditSave(item.id)}>
                    {saving ? '…' : 'Enregistrer'}
                  </button>
                  <button className="btn small" onClick={() => setEditingId(null)}>Annuler</button>
                </div>
              </div>
            ) : (
              <>
                <div className="info-block-header">
                  <div className="info-block-title">{item.title}</div>
                  <div className="info-block-actions">
                    <button
                      className="btn small"
                      aria-label="Modifier"
                      onClick={() => {
                        haptic.tap();
                        setDrafts((p) => ({ ...p, [item.id]: { title: item.title, body: item.body || '' } }));
                        setEditingId(item.id);
                      }}
                    >
                      ✎
                    </button>
                    <button className="btn small" aria-label="Supprimer" onClick={() => handleDelete(item.id)}>🗑</button>
                  </div>
                </div>
                {item.body && <div className="info-block-body">{item.body}</div>}
                {item.photo_url && <img src={item.photo_url} alt={item.title} className="info-block-photo" />}
                <label className="info-photo-upload">
                  {uploadingId === item.id ? 'Envoi…' : item.photo_url ? 'Changer la photo' : '+ Ajouter une photo'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploadingId === item.id}
                    onChange={(e) => handlePhoto(item.id, e.target.files[0])}
                  />
                </label>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HomeView({
  activity,
  bookings,
  members,
  mileageLogs,
  importantInfo,
  onImportantInfoChange,
  onGoToTab,
}) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const today = startOfToday();

  const currentTrip = bookings.find((b) => parseDate(b.start_date) <= today && today <= parseDate(b.end_date));
  const nextUpcoming = bookings
    .filter((b) => parseDate(b.start_date) > today)
    .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))[0];
  const trip = currentTrip || nextUpcoming;
  const isActive = !!currentTrip;

  const pastTrip = bookings
    .filter((b) => parseDate(b.end_date) < today && b.note)
    .sort((a, b) => parseDate(b.end_date) - parseDate(a.end_date))[0];

  return (
    <div className="home-view">
      <div className="home-grid">
        <CountdownCard trip={trip} member={trip ? memberById[trip.member_id] : null} isActive={isActive} />
        <WeatherCard nextTrip={nextUpcoming} />
        <AnecdoteCard pastTrip={pastTrip} member={pastTrip ? memberById[pastTrip.member_id] : null} />
        <StatsCard bookings={bookings} mileageLogs={mileageLogs} members={members} />
      </div>

      <ImportantInfoCard items={importantInfo} onItemsChange={onImportantInfoChange} />

      <div className="section-title-row">
        <h2 className="section-title"><span>📖</span> Activité récente</h2>
        {activity.length > 0 && (
          <button className="btn small" onClick={() => onGoToTab('activite')}>Tout voir</button>
        )}
      </div>
      {activity.length === 0 && <div className="empty-state">Rien à signaler pour l'instant.</div>}
      {activity.slice(0, 4).map((a) => (
        <div key={a.id} className="activity-row">
          <Avatar member={a.member} size="sm" />
          <div className="activity-body">
            <div className="activity-text">
              <span className="activity-icon">{a.icon}</span>
              <strong>{a.member?.name || 'Quelqu\'un'}</strong> {a.text}
            </div>
            <div className="activity-time">{timeAgo(a.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
