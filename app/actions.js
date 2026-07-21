'use server';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export async function getMembers() {
  const { data, error } = await supabaseAdmin.from('members').select('*').order('role', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBookings() {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addBooking({ member_id, start_date, end_date, note }) {
  const { error } = await supabaseAdmin
    .from('bookings')
    .insert({ member_id, start_date, end_date, note: note || null });
  if (error) throw error;
  return getBookings();
}

export async function deleteBooking(id) {
  const { error } = await supabaseAdmin.from('bookings').delete().eq('id', id);
  if (error) throw error;
  return getBookings();
}

export async function editBooking(id, { start_date, end_date, note }) {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ start_date, end_date, note: note || null })
    .eq('id', id);
  if (error) throw error;
  return getBookings();
}

export async function getInventory() {
  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .order('zone', { ascending: true });
  if (error) throw error;
  return data;
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
  const { error } = await supabaseAdmin.from('inventory_items').delete().eq('id', id);
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
  const { error: commentsError } = await supabaseAdmin.from('comments').delete().eq('member_id', id);
  if (commentsError) throw commentsError;

  const { error: bookingsError } = await supabaseAdmin.from('bookings').delete().eq('member_id', id);
  if (bookingsError) throw bookingsError;

  const { error: mileageError } = await supabaseAdmin
    .from('mileage_logs')
    .update({ recorded_by: null })
    .eq('recorded_by', id);
  if (mileageError) throw mileageError;

  const { error: inventoryError } = await supabaseAdmin
    .from('inventory_items')
    .update({ updated_by: null })
    .eq('updated_by', id);
  if (inventoryError) throw inventoryError;

  const { error } = await supabaseAdmin.from('members').delete().eq('id', id);
  if (error) throw error;

  const [members, bookings, comments] = await Promise.all([getMembers(), getBookings(), getComments()]);
  return { members, bookings, comments };
}

export async function getComments() {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addComment({ target_type, target_id, member_id, text }) {
  const { error } = await supabaseAdmin
    .from('comments')
    .insert({ target_type, target_id, member_id, text });
  if (error) throw error;
  return getComments();
}

export async function deleteComment(id) {
  const { error } = await supabaseAdmin.from('comments').delete().eq('id', id);
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
  const { data, error } = await supabaseAdmin
    .from('maintenance_items')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
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
  const { error } = await supabaseAdmin.from('maintenance_items').delete().eq('id', id);
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
  const { data, error } = await supabaseAdmin
    .from('important_info')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('getImportantInfo failed (has the migration run?):', error.message);
    return [];
  }
  return data;
}

export async function addImportantInfo({ title, body }) {
  const { data: last } = await supabaseAdmin
    .from('important_info')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;
  const { error } = await supabaseAdmin
    .from('important_info')
    .insert({ title, body: body || null, position });
  if (error) throw error;
  return getImportantInfo();
}

export async function updateImportantInfo(id, { title, body }) {
  const { error } = await supabaseAdmin
    .from('important_info')
    .update({ title, body: body || null })
    .eq('id', id);
  if (error) throw error;
  return getImportantInfo();
}

export async function deleteImportantInfo(id) {
  const { data: row } = await supabaseAdmin.from('important_info').select('photo_url').eq('id', id).maybeSingle();
  if (row?.photo_url) {
    const path = row.photo_url.split('/important-info/')[1];
    if (path) await supabaseAdmin.storage.from('important-info').remove([path]);
  }
  const { error } = await supabaseAdmin.from('important_info').delete().eq('id', id);
  if (error) throw error;
  return getImportantInfo();
}

export async function reorderImportantInfo(orderedIds) {
  await Promise.all(orderedIds.map((id, position) => supabaseAdmin.from('important_info').update({ position }).eq('id', id)));
  return getImportantInfo();
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
