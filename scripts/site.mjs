#!/usr/bin/env node
/**
 * Configuration de l'adresse publique du site (site.config.json) :
 * - avec un domaine personnalisé : https://<domaine>, servi à la racine ("/") ;
 * - sinon : GitHub Pages, servi sous /WinterArc.
 *
 * Usage :
 *   node scripts/site.mjs env             -> variables à ajouter à $GITHUB_ENV (SITE_URL, BASE_PATH, EXPO_PUBLIC_*)
 *   node scripts/site.mjs finalize <dist> -> remplace %BASE_PATH% dans les fichiers publics et écrit CNAME
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));

export const SITE_URL = cfg.domain ? `https://${cfg.domain}` : cfg.githubPagesUrl.replace(/\/$/, '');
export const BASE_PATH = new URL(SITE_URL).pathname.replace(/\/$/, '');

const [cmd, dist] = process.argv.slice(2);
if (cmd === 'env') {
  console.log(`SITE_URL=${SITE_URL}`);
  console.log(`BASE_PATH=${BASE_PATH}`);
  console.log(`EXPO_PUBLIC_SITE_URL=${SITE_URL}`);
  console.log(`EXPO_PUBLIC_BASE_PATH=${BASE_PATH}`);
} else if (cmd === 'finalize') {
  for (const f of ['index.html', '404.html', 'manifest.webmanifest', 'sw.js']) {
    const p = join(dist, f);
    if (existsSync(p)) writeFileSync(p, readFileSync(p, 'utf8').replaceAll('%BASE_PATH%', BASE_PATH));
  }
  if (cfg.domain) writeFileSync(join(dist, 'CNAME'), `${cfg.domain}\n`);
  console.log(`Site : ${SITE_URL} (chemin de base « ${BASE_PATH || '/'} »)${cfg.domain ? ', CNAME écrit' : ''}`);
}
