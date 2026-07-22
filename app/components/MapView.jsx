'use client';
import { useEffect, useRef, useState } from 'react';
import { addSleepSpot, deleteSleepSpot, uploadSleepSpotPhoto } from '../actions';
import { haptic } from '../lib/haptics';

const FRANCE_CENTER = [46.6, 2.3];

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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function MapView({ spots, onSpotsChange, members, currentMember }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});
  const resizeObserverRef = useRef(null);
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));

  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState(null); // { lat, lng }
  const [draftName, setDraftName] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [draftFile, setDraftFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const placingRef = useRef(false);

  useEffect(() => { placingRef.current = placing; }, [placing]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapElRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapElRef.current, { zoomControl: true }).setView(FRANCE_CENTER, 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      map.on('click', (e) => {
        if (!placingRef.current) return;
        setDraft({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      mapRef.current = map;

      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(mapElRef.current);
      resizeObserverRef.current = ro;
    })();
    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};
    spots.forEach((spot) => {
      const author = memberById[spot.member_id];
      const icon = L.divIcon({
        className: 'spot-marker',
        html: `<div class="spot-flag" style="--flag-color:${author?.color || '#8A6F4E'}">🚩</div>`,
        iconSize: [30, 30],
        iconAnchor: [6, 28],
      });
      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(map);
      marker.on('click', () => { haptic.tap(); setSelected(spot); });
      markersRef.current[spot.id] = marker;
    });
  }, [spots, members]);

  function startPlacing() {
    haptic.tap();
    setPlacing(true);
  }

  function cancelDraft() {
    setDraft(null);
    setDraftName('');
    setDraftNote('');
    setDraftFile(null);
    setPlacing(false);
  }

  async function handleSaveDraft() {
    if (!draft || !currentMember) return;
    setSaving(true);
    try {
      const spot = await addSleepSpot({
        member_id: currentMember.id,
        lat: draft.lat,
        lng: draft.lng,
        name: draftName.trim(),
        note: draftNote.trim(),
      });
      let next = [spot, ...spots];
      if (draftFile) {
        const blob = await compressImage(draftFile);
        const fd = new FormData();
        fd.append('file', blob, 'photo.jpg');
        next = await uploadSleepSpotPhoto(spot.id, fd);
      }
      haptic.success();
      onSpotsChange(next);
      cancelDraft();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    haptic.tap();
    onSpotsChange(await deleteSleepSpot(id));
    setSelected(null);
  }

  return (
    <div className="map-view">
      <div className="map-toolbar">
        <p>Plante ton drapeau là où tu as dormi avec le van, avec une photo et un avis.</p>
        {!placing ? (
          <button className="btn primary small" onClick={startPlacing}>🚩 Ajouter un spot</button>
        ) : (
          <button className="btn small" onClick={() => setPlacing(false)}>Annuler</button>
        )}
      </div>
      {placing && !draft && <div className="map-hint">Touche la carte à l'endroit où tu as dormi.</div>}

      <div className="map-container" ref={mapElRef} />

      {draft && (
        <div className="overlay" onClick={cancelDraft}>
          <div className="idea-card" onClick={(e) => e.stopPropagation()}>
            <h1>🚩 Nouveau spot</h1>
            <p>Ajoute un nom, un avis et une photo si tu veux.</p>
            <div className="idea-add">
              <input
                type="text"
                placeholder="Nom du lieu (optionnel)"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Ton avis sur ce spot..."
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={(e) => setDraftFile(e.target.files?.[0] || null)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" onClick={cancelDraft}>Annuler</button>
              <button className="btn primary" style={{ flex: 1 }} onClick={handleSaveDraft} disabled={saving}>
                {saving ? '…' : 'Planter le drapeau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="idea-card" onClick={(e) => e.stopPropagation()}>
            <h1>🚩 {selected.name || 'Spot sans nom'}</h1>
            <p>{memberById[selected.member_id]?.name}{selected.created_at ? ` · ${new Date(selected.created_at).toLocaleDateString('fr-FR')}` : ''}</p>
            {selected.photo_url && (
              <img src={selected.photo_url} alt="" style={{ width: '100%', borderRadius: '14px', marginBottom: '12px' }} />
            )}
            {selected.note && <div className="idea-item-text" style={{ marginBottom: '14px' }}>{selected.note}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setSelected(null)}>Fermer</button>
              {(selected.member_id === currentMember?.id || currentMember?.id === 'vincent') && (
                <button className="btn danger" onClick={() => handleDelete(selected.id)}>🗑 Supprimer</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
