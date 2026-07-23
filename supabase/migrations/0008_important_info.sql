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
