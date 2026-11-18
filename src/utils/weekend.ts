import { FORECAST_DAYS, weatherInfo, type DayForecast, type StationConditions } from '@/api/openMeteo';
import { currentReport } from '@/api/snowReports';
import type { ResortReport } from '@/api/resorts';
import type { SnowReports } from '@/api/snowReports';
import { distanceFromGrenoble, type Station } from '@/data/stations';

export type Weekend = {
  /** Dates "YYYY-MM-DD" des jours du week-end couverts par les prévisions */
  dates: string[];
  /** Index de ces jours dans les prévisions (0 = aujourd'hui) */
  offsets: number[];
  /** Jours du week-end trop lointains pour une prévision fiable */
  missing: string[];
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Prochain week-end (ou week-end en cours), limité à l'horizon des prévisions. */
export function nextWeekend(now = new Date()): Weekend {
  const dow = now.getDay(); // 0 = dimanche
  const offsets = dow === 0 ? [0] : dow === 6 ? [0, 1] : [6 - dow, 7 - dow];
  const dates = offsets.map((o) => iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + o)));
  const ok = offsets.map((o) => o < FORECAST_DAYS);
  return {
    dates: dates.filter((_, i) => ok[i]),
    offsets: offsets.filter((_, i) => ok[i]),
    missing: dates.filter((_, i) => !ok[i]),
  };
}

export type Ranked = {
  station: Station;
  score: number;
  dist: number;
  /** Raisons affichées (points forts / points faibles) */
  pros: string[];
  cons: string[];
  weekendDays: DayForecast[];
  /** Neige fraîche attendue d'ici la fin du week-end (prévisions + 72 h passées si proche) */
  freshCm: number;
  depthCm: number | null;
  depthMeasured: boolean;
  openOnWeekend: boolean | null;
};

/** La station est-elle ouverte pendant ce week-end ? null si inconnu. */
export function openDuring(resort: ResortReport | null, lastDate: string): boolean | null {
  if (!resort || resort.status === 'unknown') return null;
  if (resort.status === 'permanentlyClosed') return false;
  if (resort.status === 'open') return true;
  if (resort.openingDate && resort.openingDate <= lastDate) {
    return !resort.closingDate || resort.closingDate >= lastDate;
  }
  return false;
}

/**
 * Note simple et explicable :
 * neige fraîche (jusqu'à 60 pts) + enneigement (jusqu'à 50 pts) + soleil (12 pts/jour)
 * − pluie (15 pts/jour) − distance depuis Grenoble (1 pt / 15 km).
 */
export function rankStation(
  station: Station,
  cond: StationConditions,
  resort: ResortReport | null,
  reports: SnowReports | null,
  weekend: Weekend,
): Ranked {
  const lastOffset = weekend.offsets[weekend.offsets.length - 1];
  const firstOffset = weekend.offsets[0];
  const days = cond.top.days;
  const weekendDays = weekend.offsets.map((o) => days[o]).filter(Boolean);
  const baseWeekend = weekend.offsets.map((o) => cond.base.days[o]).filter(Boolean);

  const upcoming = days.slice(0, lastOffset + 1).reduce((a, d) => a + d.snowfallCm, 0);
  const fresh = Math.round(upcoming + (firstOffset <= 2 ? cond.top.snowfallPast72hCm : 0));

  const report = currentReport(station, reports);
  const depth = report?.obs.snowDepthCm ?? cond.top.snowDepthCm;
  const sunny = weekendDays.filter((d) => d.weatherCode <= 2).length;
  const rainy = baseWeekend.filter((d) => d.precipMm >= 2 && d.snowfallCm < d.precipMm * 0.4).length;
  const dist = distanceFromGrenoble(station);

  const score =
    Math.min(fresh, 60) + Math.min(depth ?? 0, 200) / 4 + sunny * 12 - rainy * 15 - dist / 15;

  const pros: string[] = [];
  const cons: string[] = [];
  if (fresh >= 10) pros.push(`❄️ ${fresh} cm de neige fraîche`);
  if (depth !== null && depth >= 80) pros.push(`📏 ${depth} cm au sommet${report ? ' (mesuré)' : ''}`);
  weekendDays.forEach((d) => {
    if (d.weatherCode <= 2) pros.push(`${weatherInfo(d.weatherCode).icon} Beau ${dayName(d.date)}`);
  });
  if (dist <= 40) pros.push(`🚗 ${Math.round(dist)} km`);
  if (rainy > 0) cons.push(`🌧️ Pluie possible en bas`);
  if (depth !== null && depth < 30) cons.push(`⚠️ Peu de neige (${depth} cm)`);
  if (fresh < 3) cons.push('Pas de neige fraîche');

  return {
    station,
    score: Math.round(score),
    dist,
    pros,
    cons,
    weekendDays,
    freshCm: fresh,
    depthCm: depth,
    depthMeasured: !!report,
    openOnWeekend: openDuring(resort, weekend.dates[weekend.dates.length - 1] ?? ''),
  };
}

function dayName(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][new Date(y, m - 1, d).getDay()];
}
