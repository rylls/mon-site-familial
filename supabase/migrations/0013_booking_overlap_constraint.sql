-- Le calendrier n'affichait qu'un avertissement visuel en cas de dates qui se
-- chevauchent : rien n'empêchait deux trajets de se réserver le van au même
-- moment (deux appareils en même temps, ou l'avertissement simplement
-- ignoré). Cette contrainte le refuse au niveau de la base. Volontairement
-- limitée aux trajets ('trip') : la donnée actuelle contient déjà plusieurs
-- immobilisations pour entretien le même jour (légitime, ça ne bloque pas le
-- van deux fois), donc on ne contraint pas les chevauchements côté
-- 'maintenance'.
alter table bookings drop constraint if exists bookings_no_trip_overlap;
alter table bookings add constraint bookings_no_trip_overlap
  exclude using gist (daterange(start_date, end_date, '[]') with &&)
  where (deleted_at is null and type = 'trip');
