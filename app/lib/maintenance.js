function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Calcule le statut d'un poste d'entretien : 'inconnu' | 'ok' | 'bientot' | 'retard'
export function getMaintenanceStatus(item, currentKm) {
  const hasKmRule = item.interval_km != null && item.last_done_km != null;
  const hasDateRule = item.interval_months != null && item.last_done_date;

  if (!hasKmRule && !hasDateRule) {
    return { status: 'inconnu', dueKm: null, dueDate: null, kmLeft: null, daysLeft: null };
  }

  const today = new Date();
  const dueKm = hasKmRule ? item.last_done_km + item.interval_km : null;
  const dueDate = hasDateRule ? addMonths(item.last_done_date, item.interval_months) : null;

  const kmLeft = dueKm != null && currentKm != null ? dueKm - currentKm : null;
  const daysLeft = dueDate != null ? Math.round((dueDate - today) / 86400000) : null;

  const overdue = (kmLeft != null && kmLeft <= 0) || (daysLeft != null && daysLeft <= 0);
  if (overdue) return { status: 'retard', dueKm, dueDate, kmLeft, daysLeft };

  const soonKm = kmLeft != null && kmLeft <= Math.max(1500, (item.interval_km || 0) * 0.1);
  const soonDate = daysLeft != null && daysLeft <= 60;
  if (soonKm || soonDate) return { status: 'bientot', dueKm, dueDate, kmLeft, daysLeft };

  return { status: 'ok', dueKm, dueDate, kmLeft, daysLeft };
}

export const STATUS_LABELS = {
  inconnu: 'Inconnu',
  ok: 'À jour',
  bientot: 'Bientôt',
  retard: 'En retard',
};

export const STATUS_ORDER = { retard: 0, bientot: 1, inconnu: 2, ok: 3 };
