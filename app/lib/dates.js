export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function overlaps(aS, aE, bS, bE) {
  return aS <= bE && bS <= aE;
}

export function formatRange(startStr, endStr) {
  const s = parseDate(startStr), e = parseDate(endStr);
  const opts = { day: 'numeric', month: 'short' };
  if (startStr === endStr) return s.toLocaleDateString('fr-FR', opts);
  return `${s.toLocaleDateString('fr-FR', opts)} → ${e.toLocaleDateString('fr-FR', opts)}`;
}

export function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
