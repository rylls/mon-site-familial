-- À exécuter dans Supabase : SQL Editor > New query > coller ce fichier > Run

-- Les 4 profils de la famille (pas de mot de passe, juste un profil qu'on choisit)
create table if not exists members (
  id text primary key,
  name text not null,
  role text not null check (role in ('parent','enfant')),
  color text not null
);

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

-- Inventaire embarqué dans le van, organisé par zone (pour le schéma en coupe)
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  zone text not null check (zone in ('cuisine','frigo','eau','gaz','eclairage','rangement','exterieur')),
  name text not null,
  level text not null default 'plein' check (level in ('plein','partiel','vide')),
  updated_by text references members(id),
  updated_at timestamptz not null default now()
);

insert into inventory_items (zone, name, level) values
  ('cuisine', 'Sel', 'plein'),
  ('cuisine', 'Poivre', 'plein'),
  ('cuisine', 'Huile', 'plein'),
  ('cuisine', 'Liquide vaisselle', 'plein'),
  ('cuisine', 'Éponges', 'plein'),
  ('cuisine', 'Allumettes', 'plein'),
  ('frigo', 'Bac à glaçons', 'plein'),
  ('eau', 'Réservoir eau claire', 'plein'),
  ('eau', 'Bidon d''appoint', 'plein'),
  ('gaz', 'Bouteille de gaz', 'plein'),
  ('eclairage', 'Ampoules de rechange', 'plein'),
  ('eclairage', 'Piles lampe de poche', 'plein'),
  ('rangement', 'Papier toilette', 'plein'),
  ('rangement', 'Sacs poubelle', 'plein'),
  ('exterieur', 'Jerrican essence', 'plein'),
  ('exterieur', 'Cales de niveau', 'plein')
on conflict do nothing;

-- RLS activée : aucune policy publique. L'app utilise la clé "service_role"
-- côté serveur (elle contourne toujours RLS), donc une clé anon fuitée
-- n'aurait accès à rien.
alter table members enable row level security;
alter table bookings enable row level security;
alter table inventory_items enable row level security;
