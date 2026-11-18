import type { Station } from '@/data/stations';

/**
 * Bulletins déclarés par les stations (statut, remontées / pistes ouvertes, neige),
 * repris de Skiinfo / OnTheSnow par scripts/fetch-resorts.mjs dans GitHub Actions.
 */
export const RESORTS_URL = 'https://nukifa.github.io/WinterArc/resorts.json';

export type ResortStatus = 'open' | 'closed' | 'temporarilyClosed' | 'permanentlyClosed' | 'unknown';

export type OpenTotal = { open: number | null; total: number | null };

export type ResortReport = {
  path: string;
  page: string;
  name: string;
  updatedAt: string | null;
  status: ResortStatus;
  openingDate: string | null;
  closingDate: string | null;
  snow: {
    base: number | null;
    middle: number | null;
    summit: number | null;
    last24: number | null;
    last48: number | null;
    last72: number | null;
  };
  lifts: OpenTotal;
  runs: OpenTotal;
  km: OpenTotal;
  runsByLevel: Record<'beginner' | 'intermediate' | 'advanced' | 'expert', { total: number | null; km: number | null } | null>;
  parks: number | null;
  schedule: { day: number; from: string; to: string; night: boolean }[];
  trailMap: string | null;
};

export type ResortIndex = {
  source: string;
  generatedAt: string;
  resorts: Record<string, ResortReport>;
};

export async function fetchResorts(): Promise<ResortIndex> {
  const res = await fetch(`${RESORTS_URL}?t=${Math.floor(Date.now() / 600_000)}`);
  if (!res.ok) throw new Error(`Bulletins stations indisponibles (${res.status})`);
  return res.json();
}

export function stationResort(station: Station, index: ResortIndex | null): ResortReport | null {
  return index?.resorts[station.skiinfo] ?? null;
}

export const STATUS_LABEL: Record<ResortStatus, string> = {
  open: 'Ouverte',
  closed: 'Fermée',
  temporarilyClosed: 'Fermée temporairement',
  permanentlyClosed: 'Fermée définitivement',
  unknown: 'Statut inconnu',
};

/** "12/16" ou "16" quand le nombre ouvert n'est pas renseigné */
export function openTotal(v: OpenTotal): string | null {
  if (v.total === null) return null;
  return v.open !== null ? `${v.open}/${v.total}` : `${v.total}`;
}

/** La date d'ouverture prévue est-elle dans le futur ? */
export function upcomingOpening(r: ResortReport): string | null {
  if (r.status === 'open' || !r.openingDate) return null;
  return new Date(`${r.openingDate}T23:59:59`).getTime() >= Date.now() ? r.openingDate : null;
}
