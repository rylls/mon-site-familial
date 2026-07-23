-- Inventaire embarqué dans le van, organisé par zone (pour le schéma en coupe)
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  zone text not null check (zone in ('cuisine','frigo','eau','utilitaire','gaz','eclairage','rangement','exterieur','couchages','mecanique')),
  name text not null,
  level text not null default 'plein' check (level in ('plein','partiel','vide')),
  updated_by text references members(id),
  updated_at timestamptz not null default now(),
  unique (zone, name)
);

-- Ajoute la contrainte d'unicité si la table existait déjà avant son introduction
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inventory_items_zone_name_key') then
    alter table inventory_items add constraint inventory_items_zone_name_key unique (zone, name);
  end if;
end $$;

-- Autorise les nouvelles zones "couchages", "utilitaire" et "mecanique" si la
-- contrainte existait déjà avant leur ajout
alter table inventory_items drop constraint if exists inventory_items_zone_check;
alter table inventory_items add constraint inventory_items_zone_check
  check (zone in ('cuisine','frigo','eau','utilitaire','gaz','eclairage','rangement','exterieur','couchages','mecanique'));

insert into inventory_items (zone, name, level) values
  ('cuisine', 'Sel', 'plein'),
  ('cuisine', 'Poivre', 'plein'),
  ('cuisine', 'Huile', 'plein'),
  ('cuisine', 'Liquide vaisselle', 'plein'),
  ('cuisine', 'Éponges', 'plein'),
  ('cuisine', 'Allumettes', 'plein'),
  ('frigo', 'Bac à glaçons', 'plein'),
  ('utilitaire', 'Réservoir eau claire', 'plein'),
  ('utilitaire', 'Bidon d''appoint', 'plein'),
  ('gaz', 'Bouteille de gaz', 'plein'),
  ('eclairage', 'Ampoules de rechange', 'plein'),
  ('eclairage', 'Piles lampe de poche', 'plein'),
  ('rangement', 'Papier toilette', 'plein'),
  ('rangement', 'Sacs poubelle', 'plein'),
  ('rangement', 'Jerrican essence', 'plein'),
  ('rangement', 'Cales de niveau', 'plein'),
  ('couchages', 'Draps', 'plein'),
  ('couchages', 'Couvertures', 'plein'),
  ('mecanique', 'Liquide lave-glace', 'plein'),
  ('mecanique', 'Diesel', 'plein')
on conflict (zone, name) do nothing;

-- La zone "exterieur" a été retirée de l'interface : les objets existants
-- sont rapatriés dans "rangement" pour ne pas les perdre.
update inventory_items set zone = 'rangement' where zone = 'exterieur';

-- La zone "eau" a été renommée "utilitaire" : on migre les objets existants
-- pour qu'ils restent visibles sous le nouvel identifiant. Idempotent : si un
-- doublon existe déjà côté "utilitaire" (ex: le seed ci-dessus l'a recréé),
-- on supprime l'ancien plutôt que de provoquer un conflit d'unicité.
delete from inventory_items a
  where a.zone = 'eau'
  and exists (select 1 from inventory_items b where b.zone = 'utilitaire' and b.name = a.name);
update inventory_items set zone = 'utilitaire' where zone = 'eau';
