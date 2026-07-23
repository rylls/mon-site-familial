# Wouchi — le van de la famille

Site pour gérer le prêt de Wouchi entre Dominique, Christine, Simon et
Vincent : calendrier de réservation + inventaire du van (schéma en coupe
cliquable).

Le site est protégé par un mot de passe unique partagé (`wouchijr` par
défaut, modifiable). Une fois entré sur un appareil, chacun clique ensuite
sur son icône pour se signaler — pas de mot de passe individuel.

## 1. Créer le projet Supabase

1. Va sur https://supabase.com, crée un compte puis un nouveau projet.
2. Ouvre **SQL Editor > New query**, puis colle et exécute (**Run**) chaque
   fichier de `supabase/migrations/` **dans l'ordre numérique** (`0001_...`,
   `0002_...`, etc. — un fichier = une requête, l'un après l'autre). Cela crée
   les tables `members` (avec Dominique, Christine, Simon, Vincent déjà
   remplis), `bookings` et `inventory_items` (avec le sel, l'eau, le gaz, les
   ampoules, etc. déjà listés), et applique toutes les évolutions ajoutées
   depuis.
3. Pour un projet Supabase qui existe déjà (mise à jour plutôt que création),
   n'exécute que les fichiers de `supabase/migrations/` que tu n'as pas encore
   lancés — chacun est numéroté et idempotent (relançable sans risque), donc
   en cas de doute tu peux aussi tous les relancer depuis `0001_`.
3. Va dans **Settings > API**. Note deux valeurs :
   - **Project URL**
   - **service_role secret** (clique sur "Reveal" — ⚠️ à garder secrète,
     ne jamais la publier ni la mettre dans une variable `NEXT_PUBLIC_`)

## 2. Configurer le projet en local

```bash
npm install
cp .env.example .env.local
```

Ouvre `.env.local` et remplis :

```
SUPABASE_URL=... (le Project URL)
SUPABASE_SERVICE_ROLE_KEY=... (le service_role secret)
SITE_PASSWORD=wouchijr
```

Tu peux changer `SITE_PASSWORD` pour n'importe quelle valeur : c'est le mot
de passe unique que toute la famille utilisera pour entrer sur le site.

Puis lance :

```bash
npm run dev
```

Le site est disponible sur http://localhost:3000

## 3. Mettre le code sur Git

```bash
git init
git add .
git commit -m "Premier commit : le van de la famille"
```

Crée un dépôt vide sur GitHub (ou GitLab/Bitbucket), puis :

```bash
git remote add origin <URL_DE_TON_DEPOT>
git branch -M main
git push -u origin main
```

Le fichier `.gitignore` exclut déjà `.env.local` : ta clé Supabase ne sera
jamais poussée sur Git.

## 4. Déployer sur Vercel

1. Va sur https://vercel.com et connecte-toi avec ton compte Git.
2. Clique **Add New > Project**, choisis le dépôt que tu viens de créer.
3. Avant de déployer, ouvre **Environment Variables** et ajoute les mêmes
   variables que dans `.env.local` :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_PASSWORD`
4. Clique **Deploy**. Au bout d'une minute, Vercel te donne une URL du type
   `https://van-familial.vercel.app`.
5. Partage ce lien avec la famille — chacun choisit son icône au premier
   passage, et n'aura plus besoin de le refaire sur son appareil.

Chaque fois que tu pousses du code sur la branche `main`, Vercel redéploie
automatiquement le site.

## Structure du projet

- `app/page.jsx` — récupère les données Supabase et affiche l'app
- `app/actions.js` — toutes les lectures/écritures Supabase (server actions)
- `app/components/` — Calendrier, schéma du van, sélecteur de profil, etc.
- `lib/supabaseAdmin.js` — client Supabase côté serveur uniquement
- `supabase/migrations/` — évolutions de la base, une par fichier numéroté, à
  exécuter dans Supabase dans l'ordre ; toute nouvelle évolution s'ajoute ici
  comme un nouveau fichier plutôt que de modifier les précédents

## Pour aller plus loin

- Ajouter une 5ᵉ personne : ajoute une ligne dans la table `members` (Supabase
  > Table Editor), avec un `id`, un `name`, un `role` et une `color` (code
  hexadécimal).
- Ajouter un objet à l'inventaire : ajoute une ligne dans `inventory_items`
  avec la `zone` correspondante (`cuisine`, `frigo`, `eau`, `gaz`,
  `eclairage`, `rangement` ou `exterieur`).
