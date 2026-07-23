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
