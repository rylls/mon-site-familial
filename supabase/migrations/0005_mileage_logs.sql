-- Relevés kilométriques du van, saisis manuellement par la famille
create table if not exists mileage_logs (
  id uuid primary key default gen_random_uuid(),
  km integer not null,
  recorded_at date not null default current_date,
  recorded_by text references members(id),
  created_at timestamptz not null default now()
);
