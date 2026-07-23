-- Suppression douce (undo pendant 5s) : au lieu d'effacer la ligne tout de
-- suite, on marque juste deleted_at et on filtre les lectures dessus. Évite
-- qu'un reload pendant la fenêtre d'annulation ne fasse "réapparaître" un
-- élément jamais réellement supprimé côté base.
alter table bookings add column if not exists deleted_at timestamptz;
alter table inventory_items add column if not exists deleted_at timestamptz;
alter table maintenance_items add column if not exists deleted_at timestamptz;
alter table ideas add column if not exists deleted_at timestamptz;
alter table important_info add column if not exists deleted_at timestamptz;
alter table comments add column if not exists deleted_at timestamptz;

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
