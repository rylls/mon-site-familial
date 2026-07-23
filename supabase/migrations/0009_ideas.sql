-- Boîte à idées : accessible via l'ampoule flottante. Toute la famille peut
-- proposer une idée, seul Vincent peut la valider ou la supprimer.
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references members(id),
  text text not null,
  status text not null default 'pending' check (status in ('pending','validated')),
  created_at timestamptz not null default now()
);
