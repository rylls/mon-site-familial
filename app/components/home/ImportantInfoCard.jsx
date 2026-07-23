'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import RichTextEditor from './RichTextEditor';
import { addImportantInfo, updateImportantInfo, deleteImportantInfo, restoreImportantInfo, uploadImportantInfoPhoto, reorderImportantInfo } from '../../actions';
import { haptic } from '../../lib/haptics';
import { useToast } from '../ToastProvider';

function compressImage(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
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

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.trim().match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function ImportantInfoCard({ items, onItemsChange }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const newBodyRef = useRef(null);
  const editBodyRef = useRef(null);
  const listRef = useRef(null);
  const initedCollapseRef = useRef(false);
  const showToast = useToast();

  useEffect(() => {
    if (initedCollapseRef.current) return;
    if (items.length === 0) return;
    initedCollapseRef.current = true;
    setCollapsedIds(new Set(items.map((i) => i.id)));
  }, [items]);

  function toggleCollapsed(id) {
    haptic.tap();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePointerDownDrag(e, id) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    haptic.tap();
    setDraggingId(id);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }

  function handlePointerMoveDrag(e) {
    if (!draggingId || !listRef.current) return;
    const blocks = Array.from(listRef.current.querySelectorAll('[data-info-id]'));
    const y = e.clientY;
    let overId = null;
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        overId = block.dataset.infoId;
        break;
      }
    }
    if (overId && overId !== dragOverId) setDragOverId(overId);
  }

  function handlePointerUpDrag() {
    if (draggingId && dragOverId && draggingId !== dragOverId) {
      const fromIdx = items.findIndex((i) => i.id === draggingId);
      const toIdx = items.findIndex((i) => i.id === dragOverId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const reordered = [...items];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        onItemsChange(reordered);
        haptic.tap();
        reorderImportantInfo(reordered.map((i) => i.id)).then(onItemsChange);
      }
    }
    setDraggingId(null);
    setDragOverId(null);
  }

  async function handleAddSave() {
    if (!newTitle.trim()) return;
    haptic.success();
    setSaving(true);
    try {
      const body = newBodyRef.current?.getHTML() || '';
      const updated = await addImportantInfo({ title: newTitle.trim(), body, youtube_url: newYoutubeUrl.trim() });
      onItemsChange(updated);
      showToast('Bloc ajouté');
      setNewTitle('');
      setNewYoutubeUrl('');
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
      const updated = await updateImportantInfo(id, { title: editTitle.trim(), body, youtube_url: editYoutubeUrl.trim() });
      onItemsChange(updated);
      showToast('Bloc modifié');
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    haptic.delete();
    onItemsChange(await deleteImportantInfo(id));
    showToast('Bloc supprimé', {
      type: 'danger',
      duration: 5000,
      actionLabel: 'Annuler',
      onAction: async () => {
        onItemsChange(await restoreImportantInfo(id));
      },
    });
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
          <input
            type="url"
            placeholder="Lien vidéo YouTube (optionnel)"
            value={newYoutubeUrl}
            onChange={(e) => setNewYoutubeUrl(e.target.value)}
          />
          <button className="btn small primary" disabled={!newTitle.trim() || saving} onClick={handleAddSave}>
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      )}

      {items.length === 0 && !adding && (
        <div className="empty-state">Rien pour l&apos;instant. Ajoute des infos utiles pour la famille (comment ouvrir le toit, où est la clé du gaz…).</div>
      )}

      <div ref={listRef}>
      {items.map((item) => {
        const isEditing = editingId === item.id;
        const isCollapsed = collapsedIds.has(item.id);
        return (
          <div
            key={item.id}
            data-info-id={item.id}
            className={`info-block${dragOverId === item.id && draggingId !== item.id ? ' drag-over' : ''}${draggingId === item.id ? ' dragging' : ''}`}
          >
            {isEditing ? (
              <div className="info-edit-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <RichTextEditor key={item.id} ref={editBodyRef} initialHtml={item.body || ''} />
                <input
                  type="url"
                  placeholder="Lien vidéo YouTube (optionnel)"
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
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
                  <span
                    className="info-drag-handle"
                    title="Glisser pour réordonner"
                    onPointerDown={(e) => handlePointerDownDrag(e, item.id)}
                    onPointerMove={handlePointerMoveDrag}
                    onPointerUp={handlePointerUpDrag}
                    onPointerCancel={handlePointerUpDrag}
                  >
                    ⠿
                  </span>
                  <button
                    className="info-block-title info-block-title-btn"
                    onClick={() => toggleCollapsed(item.id)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={`info-chevron${isCollapsed ? ' collapsed' : ''}`}>▾</span>
                    {item.title}
                  </button>
                  <div className="info-block-actions">
                    <button
                      className="btn small"
                      aria-label="Modifier"
                      onClick={() => {
                        haptic.tap();
                        setEditTitle(item.title);
                        setEditYoutubeUrl(item.youtube_url || '');
                        setEditingId(item.id);
                      }}
                    >
                      ✎
                    </button>
                    <button className="btn small" aria-label="Supprimer" onClick={() => handleDelete(item.id)}>🗑</button>
                  </div>
                </div>
                {!isCollapsed && (
                  <>
                    {item.body && (
                      <div className="info-block-body-box">
                        <div className="info-block-body" dangerouslySetInnerHTML={{ __html: item.body }} />
                      </div>
                    )}
                    {extractYouTubeId(item.youtube_url) && (
                      <div className="info-video-wrap">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(item.youtube_url)}`}
                          title={item.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                    <div className="info-photo-row">
                      {item.photo_url && (
                        <button type="button" className="info-photo-link" onClick={() => setLightbox(item.photo_url)}>
                          <Image src={item.photo_url} alt="" width={44} height={44} className="info-photo-thumb" />
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
              </>
            )}
          </div>
        );
      })}
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- unknown aspect ratio per photo; next/image would need a guessed width/height and could distort it */}
          <img src={lightbox} alt="" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Fermer">✕</button>
        </div>
      )}
    </div>
  );
}
