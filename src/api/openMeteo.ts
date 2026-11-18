import type { Station } from '@/data/stations';

/**
 * Données issues d'Open-Meteo (https://open-meteo.com), gratuit, sans clé API.
 * Le modèle "best_match" utilise en France les modèles Météo-France (AROME / ARPEGE)
 * pour les premiers jours, ce qui donne des prévisions fiables à courte échéance.
 *
 * ⚠️ La hauteur de neige est une estimation modélisée (pas le relevé officiel de la station).
 */
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/** Nombre de jours de prévision : on reste volontairement à courte échéance. */
export const FORECAST_DAYS = 5;
/** Jours passés récupérés pour l'historique des chutes de neige. */
export const PAST_DAYS = 7;

export type DayForecast = {
  date: string; // YYYY-MM-DD
  snowfallCm: number;
  precipMm: number;
  tMax: number;
  tMin: number;
  weatherCode: number;
  /** Isotherme 0 °C maximum de la journée (m) */
  freezingLevelM: number | null;
};

export type AltitudeConditions = {
  altitude: number;
  /** Hauteur de neige estimée actuellement (cm) */
  snowDepthCm: number | null;
  /** Neige tombée sur les dernières 72 h (cm) */
  snowfallPast72hCm: number;
  /** Aujourd'hui + jours suivants */
  days: DayForecast[];
  /** Chutes de neige des PAST_DAYS jours précédents (du plus ancien au plus récent) */
  history: { date: string; snowfallCm: number }[];
};

export type StationConditions = {
  top: AltitudeConditions;
  base: AltitudeConditions;
};

type OpenMeteoResponse = {
  utc_offset_seconds: number;
  hourly: {
    time: string[];
    snow_depth: (number | null)[];
    snowfall: (number | null)[];
    freezing_level_height: (number | null)[];
  };
  daily: {
    time: string[];
    snowfall_sum: (number | null)[];
    precipitation_sum: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    weather_code: (number | null)[];
  };
};

async function fetchAtAltitudes(
  points: { lat: number; lon: number; elevation: number }[],
): Promise<OpenMeteoResponse[]> {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(4)).join(','),
    longitude: points.map((p) => p.lon.toFixed(4)).join(','),
    elevation: points.map((p) => String(p.elevation)).join(','),
    hourly: 'snow_depth,snowfall,freezing_level_height',
    daily: 'snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min,weather_code',
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'Europe/Paris',
  });
  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo a répondu ${res.status}`);
  }
  const json = await res.json();
  // Une seule localisation => objet, plusieurs => tableau
  return Array.isArray(json) ? json : [json];
}

const num = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

function parse(r: OpenMeteoResponse, altitude: number): AltitudeConditions {
  // Heure locale courante au format "YYYY-MM-DDTHH" pour retrouver l'index horaire.
  const nowLocal = new Date(Date.now() + r.utc_offset_seconds * 1000).toISOString().slice(0, 13);
  const todayLocal = nowLocal.slice(0, 10);

  let nowIdx = r.hourly.time.findIndex((t) => t.startsWith(nowLocal));
  if (nowIdx < 0) nowIdx = Math.min(PAST_DAYS * 24, r.hourly.time.length - 1);

  // Hauteur de neige : dernière valeur non nulle disponible jusqu'à maintenant
  let snowDepthCm: number | null = null;
  for (let i = nowIdx; i >= 0; i--) {
    const v = r.hourly.snow_depth[i];
    if (typeof v === 'number') {
      snowDepthCm = Math.round(v * 100); // m -> cm
      break;
    }
  }

  let past72 = 0;
  for (let i = Math.max(0, nowIdx - 71); i <= nowIdx; i++) past72 += num(r.hourly.snowfall[i]);

  // Isotherme 0 °C max par jour
  const freezingByDay = new Map<string, number>();
  r.hourly.time.forEach((t, i) => {
    const v = r.hourly.freezing_level_height[i];
    if (typeof v !== 'number') return;
    const d = t.slice(0, 10);
    freezingByDay.set(d, Math.max(freezingByDay.get(d) ?? -Infinity, v));
  });

  const days: DayForecast[] = [];
  const history: AltitudeConditions['history'] = [];
  r.daily.time.forEach((date, i) => {
    if (date < todayLocal) {
      history.push({ date, snowfallCm: Math.round(num(r.daily.snowfall_sum[i]) * 10) / 10 });
      return;
    }
    days.push({
      date,
      snowfallCm: Math.round(num(r.daily.snowfall_sum[i]) * 10) / 10,
      precipMm: Math.round(num(r.daily.precipitation_sum[i]) * 10) / 10,
      tMax: Math.round(num(r.daily.temperature_2m_max[i])),
      tMin: Math.round(num(r.daily.temperature_2m_min[i])),
      weatherCode: num(r.daily.weather_code[i]),
      freezingLevelM: freezingByDay.has(date) ? Math.round(freezingByDay.get(date)! / 50) * 50 : null,
    });
  });

  return {
    altitude,
    snowDepthCm,
    snowfallPast72hCm: Math.round(past72),
    days,
    history,
  };
}

/** Récupère les conditions (sommet + bas) de toutes les stations en 2 requêtes. */
export async function fetchConditions(stations: Station[]): Promise<Record<string, StationConditions>> {
  const [tops, bases] = await Promise.all([
    fetchAtAltitudes(stations.map((s) => ({ lat: s.lat, lon: s.lon, elevation: s.altTop }))),
    fetchAtAltitudes(stations.map((s) => ({ lat: s.lat, lon: s.lon, elevation: s.altBase }))),
  ]);
  const out: Record<string, StationConditions> = {};
  stations.forEach((s, i) => {
    if (!tops[i] || !bases[i]) return;
    out[s.id] = { top: parse(tops[i], s.altTop), base: parse(bases[i], s.altBase) };
  });
  return out;
}

/** Indice de fiabilité selon l'échéance (0 = aujourd'hui). */
export function reliability(dayOffset: number): { label: string; level: 'high' | 'medium' | 'low' } {
  if (dayOffset <= 1) return { label: 'Fiable', level: 'high' };
  if (dayOffset <= 3) return { label: 'Assez fiable', level: 'medium' };
  return { label: 'Tendance', level: 'low' };
}

/** Cumul de neige prévu sur les `n` prochains jours (aujourd'hui compris). */
export function nextDaysSnowfall(days: DayForecast[], n: number): number {
  return Math.round(days.slice(0, n).reduce((acc, d) => acc + d.snowfallCm, 0));
}

export function totalSnowfall(days: DayForecast[]): number {
  return Math.round(days.reduce((acc, d) => acc + d.snowfallCm, 0));
}

/** Code météo WMO -> emoji + libellé */
export function weatherInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: '☀️', label: 'Ensoleillé' };
  if (code <= 2) return { icon: '🌤️', label: 'Éclaircies' };
  if (code === 3) return { icon: '☁️', label: 'Couvert' };
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Brouillard' };
  if (code >= 51 && code <= 57) return { icon: '🌦️', label: 'Bruine' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: '🌧️', label: 'Pluie' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: '🌨️', label: 'Neige' };
  if (code >= 95) return { icon: '⛈️', label: 'Orage' };
  return { icon: '☁️', label: '—' };
}
