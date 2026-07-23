-- Permet d'embarquer une vidéo YouTube dans un bloc "informations importantes",
-- via un champ séparé plutôt qu'en autorisant des iframes dans le corps riche
-- (qui reste strictement sanitizé côté client).
alter table important_info add column if not exists youtube_url text;
