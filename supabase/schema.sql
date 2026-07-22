-- À exécuter dans Supabase : SQL Editor > New query > coller ce fichier > Run

-- Les 4 profils de la famille (pas de mot de passe, juste un profil qu'on choisit)
create table if not exists members (
  id text primary key,
  name text not null,
  role text not null check (role in ('parent','enfant')),
  color text not null
);

-- Icône emoji personnalisée affichée à la place de l'initiale (optionnelle).
alter table members add column if not exists icon text;

insert into members (id, name, role, color) values
  ('dominique', 'Dominique', 'parent', '#C67853'),
  ('christine', 'Christine', 'parent', '#7A93A6'),
  ('simon', 'Simon', 'enfant', '#E3A83B'),
  ('vincent', 'Vincent', 'enfant', '#5B7B62')
on conflict (id) do nothing;

-- Réservations du van
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references members(id),
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default now()
);

-- Marque que la personne ayant réservé a fait le point de fin de voyage
-- (popup automatique : consommables + kilométrage).
alter table bookings add column if not exists trip_end_ack boolean not null default false;

-- Type de réservation : trajet en famille ou immobilisation pour entretien
-- (garagiste, contrôle technique...). Bloque aussi le calendrier.
alter table bookings add column if not exists type text not null default 'trip';
alter table bookings drop constraint if exists bookings_type_check;
alter table bookings add constraint bookings_type_check check (type in ('trip','maintenance'));

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

-- Commentaires : annotations libres sur une réservation ou un objet de l'inventaire
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('booking','inventory_item')),
  target_id uuid not null,
  member_id text not null references members(id),
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_target_idx on comments (target_type, target_id);

-- Relevés kilométriques du van, saisis manuellement par la famille
create table if not exists mileage_logs (
  id uuid primary key default gen_random_uuid(),
  km integer not null,
  recorded_at date not null default current_date,
  recorded_by text references members(id),
  created_at timestamptz not null default now()
);

-- Plan d'entretien : chaque poste a un intervalle en km et/ou en mois,
-- et la date/km du dernier entretien connu. Les deux champs sont modifiables
-- depuis l'app pour corriger avec de vraies factures au fil du temps.
create table if not exists maintenance_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  interval_km integer,
  interval_months integer,
  last_done_km integer,
  last_done_date date,
  notes text,
  updated_at timestamptz not null default now()
);

-- Valeurs de départ pour un VW Transporter T5.1 California 2.0 TDI Common
-- Rail 103 kW/140 ch (Euro 5, code moteur probable CFCA/CFCC) immatriculé
-- en 2010. Ce sont des intervalles généraux pour cette motorisation, pas
-- une donnée constructeur certifiée pour ce véhicule précis : à ajuster
-- dès que vous avez une facture ou le carnet d'entretien.
insert into maintenance_items (name, interval_km, interval_months, last_done_km, last_done_date, notes) values
  (
    'Courroie de distribution + galets + pompe à eau',
    180000, 72, null, '2023-06-01',
    'Moteur "avec interférence" : une rupture de courroie casse le moteur. Date approximative (2023) confirmée de mémoire par la famille, kilométrage exact au moment du changement inconnu. Intervalle constructeur historique 210 000 km/6 ans, mais ce moteur est connu pour une usure prématurée des galets tendeurs : à faire contrôler par un spécialiste VW/TDI sans attendre l''échéance en cas de doute.'
  ),
  (
    'Courroie accessoires (alternateur/clim)',
    100000, 72, null, null,
    'Courroie externe distincte de la distribution.'
  ),
  ('Vidange moteur + filtre à huile', 15000, 12, null, null, 'Diesel à usage occasionnel/camping-car : privilégier l''intervalle court plutôt que le "longlife".'),
  ('Filtre à gasoil', 60000, 48, null, null, null),
  ('Filtre à air moteur', 60000, 48, null, null, null),
  ('Filtre d''habitacle (pollen)', 30000, 24, null, null, null),
  ('Plaquettes de frein', 40000, null, null, null, 'Très variable selon l''usage : contrôler visuellement à chaque révision.'),
  ('Disques de frein', 100000, null, null, null, 'À contrôler en même temps que les plaquettes.'),
  ('Liquide de frein', null, 24, null, null, 'Hygroscopique : intervalle en temps, pas en km.'),
  ('Liquide de refroidissement', 200000, 60, null, null, null),
  ('Batterie 12V', null, 60, null, null, 'Pas d''intervalle fixe : tester si démarrage difficile, surtout après un hiver sans rouler.'),
  ('Contrôle technique', null, 24, 71855, '2026-06-02', 'Dernier CT favorable d''après le rapport Histovec.')
on conflict (name) do nothing;

-- Petite table clé/valeur pour des réglages partagés simples (ex: date à
-- partir de laquelle afficher le fil d'activité, après un "effacer").
create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Blocs "informations importantes" affichés sur l'accueil (ex: comment
-- ouvrir le toit), éditables depuis l'app, avec photo optionnelle
-- (stockée dans le bucket Storage "important-info").
create table if not exists important_info (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  photo_url text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Boîte à idées : accessible via l'ampoule flottante. Toute la famille peut
-- proposer une idée, seul Vincent peut la valider ou la supprimer.
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references members(id),
  text text not null,
  status text not null default 'pending' check (status in ('pending','validated')),
  created_at timestamptz not null default now()
);

-- La carte des spots dormis a été retirée de l'app : on nettoie la table,
-- le bucket photo et sa policy s'ils avaient été créés.
drop policy if exists "Public read sleep-spots" on storage.objects;
delete from storage.objects where bucket_id = 'sleep-spots';
delete from storage.buckets where id = 'sleep-spots';
drop table if exists sleep_spots;

-- RLS activée : aucune policy publique. L'app utilise la clé "service_role"
-- côté serveur (elle contourne toujours RLS), donc une clé anon fuitée
-- n'aurait accès à rien.
alter table members enable row level security;
alter table bookings enable row level security;
alter table inventory_items enable row level security;
alter table comments enable row level security;
alter table mileage_logs enable row level security;
alter table maintenance_items enable row level security;
alter table app_settings enable row level security;
alter table important_info enable row level security;
alter table ideas enable row level security;
