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
