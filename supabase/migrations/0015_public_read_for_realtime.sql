-- Le multi-appareils en direct (Realtime) a besoin que le rôle utilisé côté
-- navigateur (la clé publique "anon"/"publishable", volontairement exposée
-- dans le JS envoyé au client) puisse LIRE les tables via RLS : Supabase
-- Realtime n'émet un changement à un abonné que si ce rôle a le droit SELECT
-- dessus. Ces policies sont donc en lecture seule (aucun insert/update/delete
-- n'est autorisé pour "anon") ; les écritures continuent de passer
-- exclusivement par les server actions (clé service_role, jamais exposée).
-- Le contenu concerné (planning du van, inventaire, entretien...) n'a rien de
-- sensible et est de toute façon visible à quiconque connaît le mot de passe
-- du site.
drop policy if exists "Public read members" on members;
create policy "Public read members" on members for select using (true);

drop policy if exists "Public read bookings" on bookings;
create policy "Public read bookings" on bookings for select using (true);

drop policy if exists "Public read inventory_items" on inventory_items;
create policy "Public read inventory_items" on inventory_items for select using (true);

drop policy if exists "Public read comments" on comments;
create policy "Public read comments" on comments for select using (true);

drop policy if exists "Public read mileage_logs" on mileage_logs;
create policy "Public read mileage_logs" on mileage_logs for select using (true);

drop policy if exists "Public read maintenance_items" on maintenance_items;
create policy "Public read maintenance_items" on maintenance_items for select using (true);

drop policy if exists "Public read important_info" on important_info;
create policy "Public read important_info" on important_info for select using (true);

drop policy if exists "Public read ideas" on ideas;
create policy "Public read ideas" on ideas for select using (true);

-- Ajoute chaque table à la publication Realtime, une par une et sans erreur
-- si elle y est déjà (ALTER PUBLICATION ... ADD TABLE échoue sinon).
do $$
declare
  t text;
begin
  foreach t in array array['members','bookings','inventory_items','comments','mileage_logs','maintenance_items','important_info','ideas']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
