import type { Station } from '@/data/stations';

/**
 * Relevés de neige MESURÉS (réseau nivo-météorologique Météo-France).
 * Le fichier est généré par scripts/fetch-snow-reports.mjs dans GitHub Actions
 * et publié avec la version web sur GitHub Pages.
 */
export const SNOW_REPORTS_URL = 'https://nukifa.github.io/WinterArc/snow-reports.json';

/** Au-delà de cet âge, un relevé n'est plus considéré comme "actuel". */
export const MAX_REPORT_AGE_DAYS = 3;

export type SnowObservation = {
  time: string; // ISO UTC
  snowDepthCm: number | null;
  /** Neige fraîche des dernières 24 h */
  freshSnowCm: number | null;
  tempC: number | null;
};

export type NivoPost = {
  id: string;
  name: string;
  altitude: number;
  lat: number;
  lon: number;
  obs: SnowObservation[];
};

export type SnowReports = {
  source: string;
  generatedAt: string;
  posts: Record<string, NivoPost>;
};

export async function fetchSnowReports(): Promise<SnowReports> {
  const res = await fetch(`${SNOW_REPORTS_URL}?t=${Math.floor(Date.now() / 600_000)}`);
  if (!res.ok) throw new Error(`Relevés indisponibles (${res.status})`);
  return res.json();
}

export function ageDays(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86400_000;
}

export type LatestReport = {
  post: NivoPost;
  obs: SnowObservation;
  isRecent: boolean;
};

/** Dernier relevé disponible pour chaque poste rattaché à la station (le plus haut d'abord). */
export function latestReports(station: Station, reports: SnowReports | null): LatestReport[] {
  if (!reports) return [];
  return station.nivoIds
    .map((id) => reports.posts[id])
    .filter((p): p is NivoPost => !!p)
    .map((post) => {
      const withDepth = [...post.obs].reverse().find((o) => o.snowDepthCm !== null) ?? post.obs[post.obs.length - 1];
      return { post, obs: withDepth, isRecent: ageDays(withDepth.time) <= MAX_REPORT_AGE_DAYS };
    })
    .sort((a, b) => b.post.altitude - a.post.altitude);
}

/** Relevé actuel le plus représentatif (le poste le plus haut avec une mesure récente). */
export function currentReport(station: Station, reports: SnowReports | null): LatestReport | null {
  return latestReports(station, reports).find((r) => r.isRecent && r.obs.snowDepthCm !== null) ?? null;
}

export function formatPostName(name: string): string {
  return name.replace(/_NIVO$/i, '').replace(/-NIVO$/i, '');
}
