-- Les 4 profils de la famille (pas de mot de passe, juste un profil qu'on choisit)
create table if not exists members (
  id text primary key,
  name text not null,
  role text not null check (role in ('parent','enfant')),
  color text not null
);

-- Icône emoji personnalisée affichée à la place de l'initiale (optionnelle).
alter table members add column if not exists icon text;

insert into members (id, name, role, color) values
  ('dominique', 'Dominique', 'parent', '#C67853'),
  ('christine', 'Christine', 'parent', '#7A93A6'),
  ('simon', 'Simon', 'enfant', '#E3A83B'),
  ('vincent', 'Vincent', 'enfant', '#5B7B62')
on conflict (id) do nothing;
