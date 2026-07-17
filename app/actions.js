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
