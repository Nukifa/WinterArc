# ❄️ WinterArc

Application mobile (Expo / React Native) pour consulter l'enneigement des stations des Alpes,
en priorité autour de Grenoble.

## Fonctionnalités (v0)

- **Liste des stations** : filtre « Autour de Grenoble » (< 65 km) ou « Toutes les Alpes »,
  tri par distance, neige à venir ou enneigement.
- **Enneigement estimé** au sommet et en bas du domaine, et neige fraîche des dernières 72 h.
- **Prévisions de chute de neige sur 5 jours** (sommet et bas), avec températures, isotherme 0 °C
  et un indice de fiabilité : J0–J1 fiable, J2–J3 assez fiable, J4 simple tendance.
- **Webcams** : la page webcams officielle de la station s'ouvre dans l'app (WebView), avec un
  bouton pour l'ouvrir dans le navigateur. Sur la version web, c'est un lien direct.

## Données

- Météo et neige : [Open-Meteo](https://open-meteo.com) (gratuit, sans clé). En France, le modèle
  « best match » s'appuie sur les modèles Météo-France (AROME / ARPEGE).
- ⚠️ Les hauteurs de neige sont **modélisées**, ce ne sont pas les relevés officiels des stations.
- Stations, coordonnées, altitudes et liens webcams : `src/data/stations.ts`. Les liens webcams
  peuvent changer d'une saison à l'autre : vérifie-les et complète-les si besoin.

## Lancer l'app

```bash
npm install
npx expo start
```

Ensuite, scanne le QR code avec l'app **Expo Go** (Android / iOS).

## Structure

```
src/app/            écrans (Expo Router)
  index.tsx         liste des stations
  station/[id].tsx  détail : enneigement, prévisions, webcams
  webcam/[id].tsx   webcam intégrée (WebView)
src/api/openMeteo.ts  appels Open-Meteo et calculs
src/data/           stations et état partagé des conditions
```
