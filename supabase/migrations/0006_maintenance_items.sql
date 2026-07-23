-- Plan d'entretien : chaque poste a un intervalle en km et/ou en mois,
-- et la date/km du dernier entretien connu. Les deux champs sont modifiables
-- depuis l'app pour corriger avec de vraies factures au fil du temps.
create table if not exists maintenance_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  interval_km integer,
  interval_months integer,
  last_done_km integer,
  last_done_date date,
  notes text,
  updated_at timestamptz not null default now()
);

-- Valeurs de départ pour un VW Transporter T5.1 California 2.0 TDI Common
-- Rail 103 kW/140 ch (Euro 5, code moteur probable CFCA/CFCC) immatriculé
-- en 2010. Ce sont des intervalles généraux pour cette motorisation, pas
-- une donnée constructeur certifiée pour ce véhicule précis : à ajuster
-- dès que vous avez une facture ou le carnet d'entretien.
insert into maintenance_items (name, interval_km, interval_months, last_done_km, last_done_date, notes) values
  (
    'Courroie de distribution + galets + pompe à eau',
    180000, 72, null, '2023-06-01',
    'Moteur "avec interférence" : une rupture de courroie casse le moteur. Date approximative (2023) confirmée de mémoire par la famille, kilométrage exact au moment du changement inconnu. Intervalle constructeur historique 210 000 km/6 ans, mais ce moteur est connu pour une usure prématurée des galets tendeurs : à faire contrôler par un spécialiste VW/TDI sans attendre l''échéance en cas de doute.'
  ),
  (
    'Courroie accessoires (alternateur/clim)',
    100000, 72, null, null,
    'Courroie externe distincte de la distribution.'
  ),
  ('Vidange moteur + filtre à huile', 15000, 12, null, null, 'Diesel à usage occasionnel/camping-car : privilégier l''intervalle court plutôt que le "longlife".'),
  ('Filtre à gasoil', 60000, 48, null, null, null),
  ('Filtre à air moteur', 60000, 48, null, null, null),
  ('Filtre d''habitacle (pollen)', 30000, 24, null, null, null),
  ('Plaquettes de frein', 40000, null, null, null, 'Très variable selon l''usage : contrôler visuellement à chaque révision.'),
  ('Disques de frein', 100000, null, null, null, 'À contrôler en même temps que les plaquettes.'),
  ('Liquide de frein', null, 24, null, null, 'Hygroscopique : intervalle en temps, pas en km.'),
  ('Liquide de refroidissement', 200000, 60, null, null, null),
  ('Batterie 12V', null, 60, null, null, 'Pas d''intervalle fixe : tester si démarrage difficile, surtout après un hiver sans rouler.'),
  ('Contrôle technique', null, 24, 71855, '2026-06-02', 'Dernier CT favorable d''après le rapport Histovec.')
on conflict (name) do nothing;
