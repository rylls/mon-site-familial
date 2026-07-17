import { formatRange } from './dates';

export function buildActivity({ bookings, comments, inventory, members }) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const items = [];

  for (const b of bookings) {
    items.push({
      id: `booking-${b.id}`,
      timestamp: b.created_at,
      member: memberById[b.member_id],
      text: `a réservé le van du ${formatRange(b.start_date, b.end_date)}`,
      icon: '🚐',
    });
  }

  for (const c of comments) {
    let target = '';
    if (c.target_type === 'booking') {
      const b = bookings.find((bk) => bk.id === c.target_id);
      target = b ? `le trajet du ${formatRange(b.start_date, b.end_date)}` : 'un trajet';
    } else {
      const item = inventory.find((i) => i.id === c.target_id);
      target = item ? `« ${item.name} »` : 'un objet';
    }
    items.push({
      id: `comment-${c.id}`,
      timestamp: c.created_at,
      member: memberById[c.member_id],
      text: `a commenté sur ${target} : "${c.text}"`,
      icon: '💬',
    });
  }

  for (const i of inventory) {
    if (!i.updated_by || !i.updated_at) continue;
    items.push({
      id: `item-${i.id}-${i.updated_at}`,
      timestamp: i.updated_at,
      member: memberById[i.updated_by],
      text: `a mis « ${i.name} » à ${i.level}`,
      icon: '🎒',
    });
  }

  return items
    .filter((i) => i.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 30);
}
