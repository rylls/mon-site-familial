-- Petite table clé/valeur pour des réglages partagés simples (ex: date à
-- partir de laquelle afficher le fil d'activité, après un "effacer").
create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
