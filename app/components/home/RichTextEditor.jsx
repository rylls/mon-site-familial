'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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

export default RichTextEditor;
