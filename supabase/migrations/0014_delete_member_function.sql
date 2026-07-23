-- Supprimer un membre touchait 5 tables l'une après l'autre côté app : si la
-- 3e échouait, les 2 premières étaient déjà appliquées et la base restait
-- dans un état incohérent. Regrouper ça dans une fonction en fait une seule
-- transaction (tout ou rien).
create or replace function delete_member(p_member_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from comments where member_id = p_member_id;
  delete from bookings where member_id = p_member_id;
  update mileage_logs set recorded_by = null where recorded_by = p_member_id;
  update inventory_items set updated_by = null where updated_by = p_member_id;
  delete from members where id = p_member_id;
end;
$$;
