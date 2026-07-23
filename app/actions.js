'use server';
import { supabaseAdmin } from '../lib/supabaseAdmin';

// Le filtre `deleted_at` (suppression douce + undo) est ajouté par migration ;
// si elle n'a pas encore été exécutée sur ce projet Supabase, la colonne
// n'existe pas encore et PostgREST renvoie une erreur "column does not
// exist" (42703). On retombe alors sur une lecture sans filtre plutôt que
// de planter toute l'app tant que la migration n'a pas tourné.
function isMissingDeletedAtColumn(error) {
  return error?.code === '42703' || /deleted_at/.test(error?.message || '');
}

// `buildQuery(filterDeletedAt)` doit renvoyer la requête Supabase déjà
// ordonnée. Centralise le repli "colonne pas encore migrée" pour tous les
// `get*` qui filtrent sur `deleted_at`, plutôt que de dupliquer le essai/repli
// dans chaque fonction. `retries` permet d'absorber une erreur transitoire
// (utilisé par getImportantInfo, qui a déjà connu des échecs intermittents).
async function queryWithDeletedAtFallback(buildQuery, { retries = 1 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    let { data, error } = await buildQuery(true);
    if (!error) return data;
    if (isMissingDeletedAtColumn(error)) {
      ({ data, error } = await buildQuery(false));
      if (!error) return data;
    }
    lastError = error;
    if (attempt < retries - 1) {
      console.error(`Requête échouée (essai ${attempt + 1}/${retries}) :`, error.message);
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function getMembers() {
  const { data, error } = await supabaseAdmin.from('members').select('*').order('role', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBookings() {
  return queryWithDeletedAtFallback((filterDeletedAt) => {
    let q = supabaseAdmin.from('bookings').select('*');
    if (filterDeletedAt) q = q.is('deleted_at', null);
    return q.order('start_date', { ascending: true });
  });
}

export async function addBooking({ member_id, start_date, end_date, note, type }) {
  const { error } = await supabaseAdmin
    .from('bookings')
    .insert({ member_id, start_date, end_date, note: note || null, type: type || 'trip' });
  if (error) throw error;
  return getBookings();
}

export async function deleteBooking(id) {
  const { error } = await supabaseAdmin.from('bookings').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return getBookings();
}

export async function restoreBooking(id) {
  const { error } = await supabaseAdmin.from('bookings').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  return getBookings();
}

export async function editBooking(id, { start_date, end_date, note, type }) {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ start_date, end_date, note: note || null, type: type || 'trip' })
    .eq('id', id);
  if (error) throw error;
  return getBookings();
}

export async function ackTripEnd(id) {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ trip_end_ack: true })
    .eq('id', id);
  if (error) throw error;
  return getBookings();
}

export async function getInventory() {
  return queryWithDeletedAtFallback((filterDeletedAt) => {
    let q = supabaseAdmin.from('inventory_items').select('*');
    if (filterDeletedAt) q = q.is('deleted_at', null);
    return q.order('zone', { ascending: true });
  });
}

export async function updateInventoryLevel(id, level, updated_by) {
  const { error } = await supabaseAdmin
    .from('inventory_items')
    .update({ level, updated_by, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return getInventory();
}

export async function addInventoryItem({ zone, name }) {
  const { error } = await supabaseAdmin
    .from('inventory_items')
    .insert({ zone, name, level: 'plein' });
  if (error) throw error;
  return getInventory();
}

export async function deleteInventoryItem(id) {
  const { error } = await supabaseAdmin.from('inventory_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return getInventory();
}

export async function restoreInventoryItem(id) {
  const { error } = await supabaseAdmin.from('inventory_items').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  return getInventory();
}

export async function bulkFillZone(zone, updated_by) {
  const { error } = await supabaseAdmin
    .from('inventory_items')
    .update({ level: 'plein', updated_by, updated_at: new Date().toISOString() })
    .eq('zone', zone);
  if (error) throw error;
  return getInventory();
}

export async function updateMember(id, { name, color, role, icon }) {
  const { error } = await supabaseAdmin
    .from('members')
    .update({ name, color, role, icon: icon || null })
    .eq('id', id);
  if (error) throw error;
  return getMembers();
}

function slugifyMemberId(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'membre'}-${Date.now().toString(36)}`;
}

export async function addMember({ name, role, color, icon }) {
  const id = slugifyMemberId(name);
  const { error } = await supabaseAdmin
    .from('members')
    .insert({ id, name, role, color, icon: icon || null });
  if (error) throw error;
  return getMembers();
}

export async function deleteMember(id) {
  // Les 5 suppressions/mises à jour (comments, bookings, mileage_logs,
  // inventory_items, members) tournent dans la fonction Postgres
  // `delete_member`, exécutée comme une seule transaction : si l'une d'elles
  // échoue, tout est annulé plutôt que de laisser la base dans un état
  // intermédiaire incohérent.
  const { error } = await supabaseAdmin.rpc('delete_member', { p_member_id: id });
  if (error) throw error;

  const [members, bookings, comments] = await Promise.all([getMembers(), getBookings(), getComments()]);
  return { members, bookings, comments };
}

export async function getComments() {
  return queryWithDeletedAtFallback((filterDeletedAt) => {
    let q = supabaseAdmin.from('comments').select('*');
    if (filterDeletedAt) q = q.is('deleted_at', null);
    return q.order('created_at', { ascending: true });
  });
}

export async function addComment({ target_type, target_id, member_id, text }) {
  const { error } = await supabaseAdmin
    .from('comments')
    .insert({ target_type, target_id, member_id, text });
  if (error) throw error;
  return getComments();
}

export async function deleteComment(id) {
  const { error } = await supabaseAdmin.from('comments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return getComments();
}

export async function restoreComment(id) {
  const { error } = await supabaseAdmin.from('comments').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  return getComments();
}

export async function getMileageLogs() {
  const { data, error } = await supabaseAdmin
    .from('mileage_logs')
    .select('*')
    .order('recorded_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMileageLog({ km, recorded_by, recorded_at }) {
  const { error } = await supabaseAdmin
    .from('mileage_logs')
    .insert({ km, recorded_by, recorded_at: recorded_at || new Date().toISOString().slice(0, 10) });
  if (error) throw error;
  return getMileageLogs();
}

export async function getMaintenanceItems() {
  return queryWithDeletedAtFallback((filterDeletedAt) => {
    let q = supabaseAdmin.from('maintenance_items').select('*');
    if (filterDeletedAt) q = q.is('deleted_at', null);
    return q.order('name', { ascending: true });
  });
}

export async function updateMaintenanceItem(id, patch) {
  const { error } = await supabaseAdmin
    .from('maintenance_items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return getMaintenanceItems();
}

export async function markMaintenanceDone(id, { km, date }) {
  const { error } = await supabaseAdmin
    .from('maintenance_items')
    .update({ last_done_km: km, last_done_date: date, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return getMaintenanceItems();
}

export async function addMaintenanceItem({ name, interval_km, interval_months, notes }) {
  const { error } = await supabaseAdmin
    .from('maintenance_items')
    .insert({ name, interval_km: interval_km || null, interval_months: interval_months || null, notes: notes || null });
  if (error) throw error;
  return getMaintenanceItems();
}

export async function deleteMaintenanceItem(id) {
  const { error } = await supabaseAdmin.from('maintenance_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return getMaintenanceItems();
}

export async function restoreMaintenanceItem(id) {
  const { error } = await supabaseAdmin.from('maintenance_items').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  return getMaintenanceItems();
}

export async function getAppSetting(key) {
  const { data, error } = await supabaseAdmin.from('app_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function clearActivity() {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert({ key: 'activity_cleared_at', value: now, updated_at: now });
  if (error) throw error;
  return now;
}

export async function getImportantInfo() {
  return queryWithDeletedAtFallback((filterDeletedAt) => {
    let q = supabaseAdmin.from('important_info').select('*');
    if (filterDeletedAt) q = q.is('deleted_at', null);
    return q.order('position', { ascending: true }).order('created_at', { ascending: true });
  }, { retries: 3 });
}

export async function addImportantInfo({ title, body, youtube_url }) {
  const { data: last } = await supabaseAdmin
    .from('important_info')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;
  const { error } = await supabaseAdmin
    .from('important_info')
    .insert({ title, body: body || null, youtube_url: youtube_url || null, position });
  if (error) throw error;
  return getImportantInfo();
}

export async function updateImportantInfo(id, { title, body, youtube_url }) {
  const { error } = await supabaseAdmin
    .from('important_info')
    .update({ title, body: body || null, youtube_url: youtube_url || null })
    .eq('id', id);
  if (error) throw error;
  return getImportantInfo();
}

export async function deleteImportantInfo(id) {
  const { error } = await supabaseAdmin.from('important_info').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return getImportantInfo();
}

export async function restoreImportantInfo(id) {
  const { error } = await supabaseAdmin.from('important_info').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  return getImportantInfo();
}

export async function reorderImportantInfo(orderedIds) {
  await Promise.all(orderedIds.map((id, position) => supabaseAdmin.from('important_info').update({ position }).eq('id', id)));
  return getImportantInfo();
}

export async function getIdeas() {
  return queryWithDeletedAtFallback((filterDeletedAt) => {
    let q = supabaseAdmin.from('ideas').select('*');
    if (filterDeletedAt) q = q.is('deleted_at', null);
    return q.order('created_at', { ascending: false });
  });
}

export async function addIdea({ member_id, text }) {
  const { error } = await supabaseAdmin.from('ideas').insert({ member_id, text });
  if (error) throw error;
  return getIdeas();
}

export async function validateIdea(id) {
  const { error } = await supabaseAdmin.from('ideas').update({ status: 'validated' }).eq('id', id);
  if (error) throw error;
  return getIdeas();
}

export async function deleteIdea(id) {
  const { error } = await supabaseAdmin.from('ideas').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return getIdeas();
}

export async function restoreIdea(id) {
  const { error } = await supabaseAdmin.from('ideas').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  return getIdeas();
}

export async function uploadImportantInfoPhoto(id, formData) {
  const file = formData.get('file');
  if (!file) throw new Error('Aucun fichier');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('important-info')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
  if (uploadError) throw uploadError;
  const { data: pub } = supabaseAdmin.storage.from('important-info').getPublicUrl(path);
  const { error } = await supabaseAdmin
    .from('important_info')
    .update({ photo_url: pub.publicUrl })
    .eq('id', id);
  if (error) throw error;
  return getImportantInfo();
}
