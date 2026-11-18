#!/usr/bin/env node
/**
 * Indexe la dernière image des webcams Skaping utilisées par l'app.
 *
 * Chaque page https://www.skaping.com/<chemin> expose sa dernière image dans la balise og:image
 * (ex. https://skaping.s3.gra.io.cloud.ovh.net/val-thorens/station/2026/11/18/large/14-40.jpg).
 * Le navigateur ne peut pas lire ces pages (pas de CORS), d'où ce script exécuté dans GitHub Actions.
 *
 * Usage : node scripts/fetch-webcams.mjs <fichier-de-sortie.json>
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2] ?? 'dist/webcams.json';
const CONCURRENCY = 6;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const src = readFileSync(join(root, 'src/data/stations.ts'), 'utf8');
const paths = [
  ...new Set(
    [...src.matchAll(/skaping:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])),
  ),
];

const decode = (s) =>
  s
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

/** Heure locale (Europe/Paris) -> ISO UTC */
function parisToIso(y, mo, d, h, mi) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  );
  const asParis = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asParis - guess)).toISOString();
}

async function index(path) {
  const page = `https://www.skaping.com/${path}`;
  const res = await fetch(page, { headers: { 'User-Agent': 'Neve-webcam-index/1.0' } });
  // Une webcam supprimée redirige vers la page de présentation de Skaping
  if (res.status !== 200 || new URL(res.url).pathname.startsWith('/about')) {
    return { path, page, error: `HTTP ${res.status} ${res.url}` };
  }
  const html = await res.text();
  const image = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
  const alt = html.match(/property="og:image:alt"\s+content="([^"]+)"/)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const m = image?.match(/^(https:\/\/[^/]+\/.+)\/(\d{4})\/(\d{2})\/(\d{2})\/large\/(\d{2})-(\d{2})\.jpg$/);
  if (!image || !m) return { path, page, error: 'image introuvable' };
  const [, base, y, mo, d, h, mi] = m;
  const day = `${base}/${y}/${mo}/${d}`;
  const file = `${h}-${mi}.jpg`;
  const label = decode(alt ?? title ?? path)
    .replace(/^Webcam\s+/i, '')
    .replace(/\s*-\s*webcam Skaping en direct\s*$/i, '')
    .trim();
  return {
    path,
    page,
    label,
    time: parisToIso(+y, +mo, +d, +h, +mi),
    // Panorama 360° : large ≈ 4800×720, small ≈ 3200×480, thumb ≈ 1200×180
    large: `${day}/large/${file}`,
    small: `${day}/small/${file}`,
    thumb: `${day}/thumb/${file}`,
  };
}

const results = [];
for (let i = 0; i < paths.length; i += CONCURRENCY) {
  const batch = paths.slice(i, i + CONCURRENCY);
  results.push(
    ...(await Promise.all(batch.map((p) => index(p).catch((e) => ({ path: p, error: String(e.message ?? e) }))))),
  );
}

const webcams = Object.fromEntries(results.filter((r) => !r.error).map((r) => [r.path, r]));
const errors = results.filter((r) => r.error);
for (const e of errors) console.warn(`⚠️  ${e.path} : ${e.error}`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ source: 'Skaping (skaping.com)', generatedAt: new Date().toISOString(), webcams }),
);
console.log(`${Object.keys(webcams).length}/${paths.length} webcams indexées -> ${OUT}`);
