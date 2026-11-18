# ❄️ Névé

Application **web** (mobile et PC, installable sur l'écran d'accueil) pour consulter l'enneigement des stations des Alpes françaises,
en priorité autour de Grenoble. (Nom de code du dépôt : WinterArc.)

## Fonctionnalités (v0)

- **40 stations** en Isère, Savoie, Haute-Savoie et Hautes-Alpes.
- **Filtres** : favoris, autour de Grenoble (< 65 km), par département ou toutes ; puis par massif
  (Belledonne, Vercors, Chartreuse, Oisans, Champsaur, Queyras…). Tri par distance, neige à venir ou
  enneigement.
- **Favoris** : étoile ☆ sur chaque station, enregistrés sur l'appareil. L'app s'ouvre directement sur
  les favoris quand il y en a.
- **Enneigement estimé** au sommet et en bas du domaine, et neige fraîche des dernières 72 h.
- **Prévisions de chute de neige sur 5 jours** (sommet et bas), avec températures, isotherme 0 °C
  et un indice de fiabilité : J0–J1 fiable, J2–J3 assez fiable, J4 simple tendance.
- **Ouverture et domaine** (bulletin déclaré par la station, via Skiinfo / OnTheSnow) : statut
  ouverte / fermée, date d'ouverture prévue, remontées et pistes ouvertes, km, pistes par niveau,
  snowparks, horaires, plan des pistes. Filtre « Ouvertes uniquement » et tri par date d'ouverture.
- **Chutes de neige** : 7 derniers jours et 5 prochains jours sur un même graphique ; « neige 3 derniers
  jours / prévue 3 jours » sur chaque carte. Stations les plus proches en bas de la fiche.
- **Webcams intégrées** (84 webcams Skaping sur 27 stations) : aperçu panoramique sur chaque carte,
  panoramas à faire défiler en haut de la fiche station avec l'heure de la photo, et vue 360°
  interactive de Skaping directement dans l'app. Lien vers la page webcams officielle pour les autres.

## Données

- **Relevés mesurés** : réseau nivo-météorologique de Météo-France (observations quotidiennes faites
  dans les stations), via [data.gouv.fr](https://www.data.gouv.fr/datasets/archive-reseau-nivo-meteorologique/)
  (licence Etalab 2.0). `scripts/fetch-snow-reports.mjs` les convertit en `snow-reports.json`, publié
  avec le site par GitHub Actions deux fois par jour. Les postes ne mesurent que pendant la saison
  (en général de mi-décembre à avril).
- **Prévisions et estimations** : [Open-Meteo](https://open-meteo.com) (gratuit, sans clé). En France,
  le modèle « best match » s'appuie sur les modèles Météo-France (AROME / ARPEGE). Quand aucun relevé
  récent n'existe, l'app affiche une hauteur de neige **estimée** par ce modèle, signalée comme telle.
- Stations, coordonnées, altitudes et liens webcams : `src/data/stations.ts`. Les liens webcams
  peuvent changer d'une saison à l'autre : vérifie-les et complète-les si besoin.

## Utilisation

👉 **https://nukifa.github.io/WinterArc/**

- **Sur PC** : directement dans le navigateur ; la liste s'affiche sur 2 ou 3 colonnes.
- **Sur mobile** : ouvrir le lien puis « Ajouter à l'écran d'accueil » (Safari : bouton Partager ;
  Chrome : menu ⋮). Névé s'ouvre alors en plein écran comme une app, avec son icône.
- **Hors connexion** : l'app et les dernières données consultées restent affichées.

Techniquement c'est une PWA (manifest + service worker « réseau d'abord » dans `public/`), construite
avec Expo / React Native Web. Le même code peut toujours produire une app mobile native si besoin.

## Publication

À chaque push, le workflow `.github/workflows/deploy-web.yml` vérifie le code (typecheck + lint),
construit le site, récupère les relevés Météo-France et publie le tout sur GitHub Pages
(Settings → Pages → Source : « GitHub Actions »). Il tourne aussi deux fois par jour pour rafraîchir les
relevés.

### Bulletins des stations

Les stations saisissent leur bulletin (ouverture, remontées, pistes, neige) chez OnTheSnow, qui le
publie sur Skiinfo. `scripts/fetch-resorts.mjs` lit la page `bulletin-neige` de chaque station (champ
`skiinfo` de `src/data/stations.ts`), décode les données embarquées par Next.js et publie
`resorts.json`. L'index publié est réutilisé s'il a moins de 3 h, pour limiter les requêtes.

### Webcams

`scripts/fetch-webcams.mjs` lit la dernière image de chaque webcam Skaping listée dans le champ
`skaping` de `src/data/stations.ts` (balise `og:image` de la page) et publie `webcams.json`. Pour
ajouter une webcam, chercher son chemin dans https://www.skaping.com/sitemap.players.xml. Les images
restent hébergées par Skaping ; la vue 360° est leur lecteur officiel, intégré tel quel.

## Développement local

```bash
npm install
npx expo start
```

Puis touche `w` pour ouvrir la version web dans le navigateur.

## Structure

```
src/app/            écrans (Expo Router)
  index.tsx         liste des stations
  station/[id].tsx  détail : enneigement, prévisions, webcams
  webcam/[id].tsx   webcam intégrée (WebView)
src/api/openMeteo.ts  appels Open-Meteo et calculs
src/data/           stations et état partagé des conditions
```
