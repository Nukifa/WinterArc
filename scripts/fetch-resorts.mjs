#!/usr/bin/env node
/**
 * Bulletins déclarés par les stations, tels que publiés par Skiinfo / OnTheSnow
 * (https://www.skiinfo.fr/<région>/<station>/bulletin-neige).
 *
 * Les stations saisissent elles-mêmes leur bulletin chez OnTheSnow (statut d'ouverture, remontées et
 * pistes ouvertes, hauteurs de neige, neige fraîche). Les pages Next.js embarquent ces données dans le
 * flux `self.__next_f` : ce script les décode et n'en garde qu'un petit résumé.
 *
 * Pour rester discret, si l'index déjà publié a moins de REUSE_HOURS heures, il est réutilisé tel quel.
 *
 * Usage : node scripts/fetch-resorts.mjs <fichier-de-sortie.json> [url-de-l-index-publié]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2] ?? 'dist/resorts.json';
const PUBLISHED = process.argv[3];
const REUSE_HOURS = 3;
const CONCURRENCY = 3;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const src = readFileSync(join(root, 'src/data/stations.ts'), 'utf8');
const slugs = [...new Set([...src.matchAll(/skiinfo:\s*'([^']+)'/g)].map((m) => m[1]))];

function write(data) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data));
}

// Réutilise l'index publié s'il est récent
if (PUBLISHED) {
  try {
    const res = await fetch(PUBLISHED);
    if (res.ok) {
      const prev = await res.json();
      const age = (Date.now() - new Date(prev.generatedAt).getTime()) / 3_600_000;
      const complete = slugs.every((s) => prev.resorts?.[s] || prev.missing?.includes(s));
      if (age < REUSE_HOURS && complete) {
        write(prev);
        console.log(`Index publié réutilisé (${age.toFixed(1)} h) -> ${OUT}`);
        process.exit(0);
      }
    }
  } catch {
    // pas d'index publié : on régénère
  }
}

/** Décode le flux RSC de Next.js en table id -> valeur JSON. */
function decodeFlight(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) => JSON.parse(`"${m[1]}"`));
  const records = {};
  for (const line of chunks.join('').split('\n')) {
    const m = line.match(/^([0-9a-f]+):(\{.*\}|\[.*\])$/);
    if (!m) continue;
    try {
      records[m[1]] = JSON.parse(m[2]);
    } catch {
      // ligne non JSON (composants)
    }
  }
  return records;
}

function resolve(value, records, depth = 0) {
  if (depth > 6) return null;
  if (typeof value === 'string' && /^\$[0-9a-f]+$/.test(value)) return resolve(records[value.slice(1)], records, depth + 1);
  if (Array.isArray(value)) return value.map((v) => resolve(v, records, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, records, depth + 1)]));
  }
  return value ?? null;
}

const STATUS = { 1: 'open', 2: 'closed', 3: 'temporarilyClosed', 6: 'permanentlyClosed' };
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function fetchResort(path) {
  const page = `https://www.skiinfo.fr/${path}/bulletin-neige`;
  const res = await fetch(page, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Neve-bulletin/1.0)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const records = decodeFlight(await res.text());
  const slug = path.split('/')[1];
  const raw = Object.values(records).find((r) => r?.slug === slug && r.terrain && r.status);
  if (!raw) throw new Error('données introuvables');
  const r = resolve(raw, records);

  const runsByLevel = Object.fromEntries(
    ['beginner', 'intermediate', 'advanced', 'expert'].map((k) => [
      k,
      r.terrain?.[`runs${k[0].toUpperCase()}${k.slice(1)}`]
        ? { total: num(r.terrain[`runs${k[0].toUpperCase()}${k.slice(1)}`].total), km: num(r.terrain[`runs${k[0].toUpperCase()}${k.slice(1)}`].totalLen) }
        : null,
    ]),
  );

  return {
    path,
    page,
    name: r.title,
    updatedAt: r.updatedAt ?? null,
    status: STATUS[r.status?.openFlag] ?? 'unknown',
    openingDate: r.status?.openingDate ?? null,
    closingDate: r.status?.closingDate ?? null,
    snow: {
      base: num(r.snow?.base),
      middle: num(r.snow?.middle),
      summit: num(r.snow?.summit),
      last24: num(r.snow?.last24),
      last48: num(r.snow?.last48),
      last72: num(r.snow?.last72),
    },
    lifts: { open: num(r.lifts?.open), total: num(r.lifts?.total) },
    runs: { open: num(r.runs?.open), total: num(r.runs?.total) },
    km: { open: num(r.terrain?.km?.open ?? r.km?.open), total: num(r.terrain?.km?.total ?? r.km?.total) },
    runsByLevel,
    parks: num(r.terrain?.parks?.total),
    schedule: Array.isArray(r.schedule)
      ? r.schedule.map((s) => ({ day: s.day, from: s.from?.slice(0, 5), to: s.to?.slice(0, 5), night: !!s.isNight }))
      : [],
    trailMap: r.trailMap?.image ?? r.trailMap?.large ?? null,
  };
}

const resorts = {};
const missing = [];
for (let i = 0; i < slugs.length; i += CONCURRENCY) {
  const batch = slugs.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(async (path) => {
      try {
        resorts[path] = await fetchResort(path);
      } catch (e) {
        console.warn(`⚠️  ${path} : ${e.message}`);
        missing.push(path);
      }
    }),
  );
}

write({
  source: 'Bulletins déclarés par les stations, via Skiinfo / OnTheSnow (skiinfo.fr)',
  generatedAt: new Date().toISOString(),
  resorts,
  missing,
});
console.log(`${Object.keys(resorts).length}/${slugs.length} bulletins de stations -> ${OUT}`);
