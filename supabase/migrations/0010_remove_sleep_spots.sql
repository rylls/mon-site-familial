-- La carte des spots dormis a été retirée de l'app : on nettoie la table
-- et sa policy. Le bucket "sleep-spots" (Storage) n'est pas supprimable en
-- SQL direct (protection Supabase) ; s'il existe, supprime-le à la main
-- depuis Dashboard > Storage si tu veux le nettoyer (il est vide et inoffensif sinon).
drop policy if exists "Public read sleep-spots" on storage.objects;
drop table if exists sleep_spots;
