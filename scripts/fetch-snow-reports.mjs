#!/usr/bin/env node
/**
 * Récupère les relevés de neige MESURÉS du réseau nivo-météorologique de Météo-France
 * (observations quotidiennes faites dans les stations de ski) et produit un petit JSON
 * consommé par l'app.
 *
 * Source : https://www.data.gouv.fr/datasets/archive-reseau-nivo-meteorologique/
 * (licence Etalab 2.0, fichier annuel mis à jour chaque jour vers 06h30 UTC).
 *
 * Usage : node scripts/fetch-snow-reports.mjs <fichier-de-sortie.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2] ?? 'dist/snow-reports.json';
const HISTORY_DAYS = 10;
const url = (year) => `https://meteofrance.s3.sbg.io.cloud.ovh.net/data/OBS/NIVOSE/nivo_${year}.csv.gz`;

// Identifiants des postes nivo utilisés par l'app (champ nivoIds de src/data/stations.ts)
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stationsSrc = readFileSync(join(root, 'src/data/stations.ts'), 'utf8');
const wanted = new Set(
  [...stationsSrc.matchAll(/nivoIds:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'(\d+)'/g)].map((x) => x[1])),
);
if (wanted.size === 0) throw new Error('Aucun nivoIds trouvé dans src/data/stations.ts');

async function download(year) {
  const res = await fetch(url(year));
  if (res.status === 404 || res.status === 403) return null; // fichier de l'année pas encore créé
  if (!res.ok) throw new Error(`${url(year)} -> HTTP ${res.status}`);
  return gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8');
}

const num = (v) => {
  if (v === undefined || v === '' || v === '-99') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const now = new Date();
const since = new Date(now.getTime() - HISTORY_DAYS * 86400_000).toISOString();
const years = [now.getUTCFullYear()];
if (now.getUTCMonth() === 0) years.unshift(now.getUTCFullYear() - 1); // début janvier : garder fin décembre

const posts = {};
for (const year of years) {
  const csv = await download(year);
  if (!csv) continue;
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(';');
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  for (const line of lines.slice(1)) {
    const f = line.split(';');
    const id = f[col.geo_id_wmo];
    if (!wanted.has(id)) continue;
    const time = f[col.validity_time];
    if (!time || time < since) continue;
    const depthM = num(f[col.ht_neige]);
    const freshM = num(f[col.ssfrai]);
    const tK = num(f[col.t]);
    if (depthM === null && freshM === null) continue;
    const post = (posts[id] ??= {
      id,
      name: f[col.name].trim(),
      altitude: Number(f[col.Altitude]),
      lat: Number(f[col.lat]),
      lon: Number(f[col.lon]),
      obs: [],
    });
    post.obs.push({
      time,
      snowDepthCm: depthM === null ? null : Math.round(depthM * 100),
      freshSnowCm: freshM === null ? null : Math.round(freshM * 100),
      tempC: tK === null ? null : Math.round((tK - 273.15) * 10) / 10,
    });
  }
}

for (const p of Object.values(posts)) p.obs.sort((a, b) => a.time.localeCompare(b.time));

const out = {
  source: 'Météo-France, réseau nivo-météorologique (data.gouv.fr, licence Etalab 2.0)',
  generatedAt: now.toISOString(),
  posts,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log(`${Object.keys(posts).length}/${wanted.size} postes avec relevés sur ${HISTORY_DAYS} jours -> ${OUT}`);
