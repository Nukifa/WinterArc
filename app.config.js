// Complète app.json :
// - chemin de base du site web selon site.config.json (GitHub Pages sous /WinterArc, ou racine d'un domaine) ;
// - numéro de version Android (versionCode) croissant à chaque construction GitHub Actions,
//   pour que chaque nouvel APK s'installe par-dessus le précédent.
const site = require('./site.config.json');

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: Number(process.env.ANDROID_VERSION_CODE ?? 1),
  },
  experiments: {
    ...config.experiments,
    baseUrl: site.domain ? '' : new URL(site.githubPagesUrl).pathname.replace(/\/$/, ''),
  },
});
