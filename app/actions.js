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

export async function updateMember(id, { name, color, role }) {
  const { error } = await supabaseAdmin
    .from('members')
    .update({ name, color, role })
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

export async function addMember({ name, role, color }) {
  const id = slugifyMemberId(name);
  const { error } = await supabaseAdmin
    .from('members')
    .insert({ id, name, role, color });
  if (error) throw error;
  return getMembers();
}

export async function deleteMember(id) {
  const { error } = await supabaseAdmin.from('members').delete().eq('id', id);
  if (error) throw error;
  return getMembers();
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
