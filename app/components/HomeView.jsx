'use client';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Avatar from './Avatar';
import { addImportantInfo, updateImportantInfo, deleteImportantInfo, uploadImportantInfoPhoto } from '../actions';
import { parseDate, formatRange, startOfToday, fmtDate } from '../lib/dates';
import { fetchDailyWeather, weatherEmoji } from '../lib/weather';
import { getMaintenanceStatus, STATUS_ORDER } from '../lib/maintenance';
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

const RTE_COLORS = ['#3B2B1D', '#C1622D', '#6E8F57', '#5E84A6', '#E0A83E', '#C0453A'];
const RTE_FONTS = [
  { label: 'Standard', value: 'Quicksand' },
  { label: 'Manuscrite', value: 'Caveat' },
  { label: 'Doodle', value: "'Patrick Hand'" },
];
const RTE_ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'BR', 'DIV', 'SPAN', 'P']);
const RTE_ALLOWED_STYLE_PROPS = new Set(['color', 'font-family']);

function sanitizeHtml(html) {
  if (typeof window === 'undefined' || !html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function clean(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!RTE_ALLOWED_TAGS.has(child.tagName)) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          return;
        }
        Array.from(child.attributes).forEach((attr) => {
          if (child.tagName === 'SPAN' && attr.name === 'style') {
            const cleanedStyle = attr.value
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean)
              .filter((decl) => RTE_ALLOWED_STYLE_PROPS.has(decl.split(':')[0].trim().toLowerCase()))
              .join('; ');
            if (cleanedStyle) child.setAttribute('style', cleanedStyle);
            else child.removeAttribute('style');
          } else {
            child.removeAttribute(attr.name);
          }
        });
        clean(child);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        node.removeChild(child);
      }
    });
  }
  clean(doc.body);
  return doc.body.innerHTML;
}

const RichTextEditor = forwardRef(function RichTextEditor({ initialHtml }, ref) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getHTML: () => sanitizeHtml(editorRef.current?.innerHTML || ''),
  }));

  function exec(cmd) {
    editorRef.current?.focus();
    document.execCommand(cmd);
  }

  function applyStyle(styleObj) {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    Object.assign(span.style, styleObj);
    try {
      range.surroundContents(span);
    } catch {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    sel.removeAllRanges();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" title="Gras" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          <b>G</b>
        </button>
        <button type="button" className="rte-btn" title="Liste à tirets" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          ≡
        </button>
        <span className="rte-sep" />
        {RTE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className="rte-color"
            style={{ background: c }}
            title="Couleur du texte"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyStyle({ color: c })}
          />
        ))}
        <span className="rte-sep" />
        <select
          className="rte-font"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) applyStyle({ fontFamily: e.target.value });
            e.target.value = '';
          }}
        >
          <option value="">Police…</option>
          {RTE_FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      <div ref={editorRef} className="rte-content" contentEditable suppressContentEditableWarning />
    </div>
  );
});

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

function MaintenanceCard({ maintenanceItems, currentKm, onGoToTab }) {
  const withStatus = maintenanceItems
    .map((item) => ({ item, status: getMaintenanceStatus(item, currentKm) }))
    .filter(({ status }) => status.status === 'retard' || status.status === 'bientot')
    .sort((a, b) => STATUS_ORDER[a.status.status] - STATUS_ORDER[b.status.status]);

  return (
    <div className="home-card maintenance-card" onClick={() => onGoToTab('entretien')}>
      <div className="home-card-title">Entretien</div>
      {withStatus.length === 0 ? (
        <div className="maintenance-ok">✅ Rien à prévoir pour l'instant.</div>
      ) : (
        <div className="maintenance-list">
          {withStatus.slice(0, 3).map(({ item, status }) => (
            <div key={item.id} className="maintenance-row">
              <span className={`maintenance-dot ${status.status}`} />
              <span className="maintenance-name">{item.name}</span>
              <span className="maintenance-when">
                {status.status === 'retard'
                  ? 'en retard'
                  : status.kmLeft != null
                    ? `dans ${status.kmLeft.toLocaleString('fr-FR')} km`
                    : `dans ${status.daysLeft} j.`}
              </span>
            </div>
          ))}
          {withStatus.length > 3 && <div className="maintenance-more">+{withStatus.length - 3} autre{withStatus.length - 3 > 1 ? 's' : ''}</div>}
        </div>
      )}
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
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const newBodyRef = useRef(null);
  const editBodyRef = useRef(null);

  async function handleAddSave() {
    if (!newTitle.trim()) return;
    haptic.success();
    setSaving(true);
    try {
      const body = newBodyRef.current?.getHTML() || '';
      const updated = await addImportantInfo({ title: newTitle.trim(), body });
      onItemsChange(updated);
      setNewTitle('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(id) {
    if (!editTitle.trim()) return;
    haptic.success();
    setSaving(true);
    try {
      const body = editBodyRef.current?.getHTML() || '';
      const updated = await updateImportantInfo(id, { title: editTitle.trim(), body });
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
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <RichTextEditor ref={newBodyRef} initialHtml="" />
          <button className="btn small primary" disabled={!newTitle.trim() || saving} onClick={handleAddSave}>
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      )}

      {items.length === 0 && !adding && (
        <div className="empty-state">Rien pour l'instant. Ajoute des infos utiles pour la famille (comment ouvrir le toit, où est la clé du gaz…).</div>
      )}

      {items.map((item) => {
        const isEditing = editingId === item.id;
        return (
          <div key={item.id} className="info-block">
            {isEditing ? (
              <div className="info-edit-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <RichTextEditor key={item.id} ref={editBodyRef} initialHtml={item.body || ''} />
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
                        setEditTitle(item.title);
                        setEditingId(item.id);
                      }}
                    >
                      ✎
                    </button>
                    <button className="btn small" aria-label="Supprimer" onClick={() => handleDelete(item.id)}>🗑</button>
                  </div>
                </div>
                {item.body && <div className="info-block-body" dangerouslySetInnerHTML={{ __html: item.body }} />}
                <div className="info-photo-row">
                  {item.photo_url && (
                    <button type="button" className="info-photo-link" onClick={() => setLightbox(item.photo_url)}>
                      <img src={item.photo_url} alt="" className="info-photo-thumb" />
                      <span>Voir la photo</span>
                    </button>
                  )}
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
                </div>
              </>
            )}
          </div>
        );
      })}

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Fermer">✕</button>
        </div>
      )}
    </div>
  );
}

export default function HomeView({
  activity,
  bookings,
  members,
  mileageLogs,
  maintenanceItems,
  currentKm,
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
        {pastTrip?.note ? (
          <AnecdoteCard pastTrip={pastTrip} member={memberById[pastTrip.member_id]} />
        ) : (
          <MaintenanceCard maintenanceItems={maintenanceItems} currentKm={currentKm} onGoToTab={onGoToTab} />
        )}
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
