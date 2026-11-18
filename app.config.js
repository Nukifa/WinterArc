// Complète app.json : chemin de base du site web selon site.config.json
// (GitHub Pages sous /WinterArc, ou racine d'un domaine personnalisé).
const site = require('./site.config.json');

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: site.domain ? '' : new URL(site.githubPagesUrl).pathname.replace(/\/$/, ''),
  },
});
