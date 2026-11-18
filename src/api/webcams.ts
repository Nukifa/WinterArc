import type { Station } from '@/data/stations';

/**
 * Index des dernières images des webcams Skaping, généré par scripts/fetch-webcams.mjs
 * dans GitHub Actions et publié avec le site.
 */
export const WEBCAMS_URL = 'https://nukifa.github.io/WinterArc/webcams.json';

/** En dessous de cet âge, l'image est considérée comme "en direct". */
export const LIVE_MAX_AGE_HOURS = 6;

export type Webcam = {
  path: string;
  /** Page Skaping (vue 360° interactive) */
  page: string;
  label: string;
  /** Heure de la photo (ISO UTC) */
  time: string;
  /** Panorama 360° ≈ 4800×720 */
  large: string;
  /** Panorama 360° ≈ 3200×480 */
  small: string;
  /** Panorama 360° ≈ 1200×180 */
  thumb: string;
};

export type WebcamIndex = {
  source: string;
  generatedAt: string;
  webcams: Record<string, Webcam>;
};

export async function fetchWebcams(): Promise<WebcamIndex> {
  const res = await fetch(`${WEBCAMS_URL}?t=${Math.floor(Date.now() / 300_000)}`);
  if (!res.ok) throw new Error(`Webcams indisponibles (${res.status})`);
  return res.json();
}

export function webcamAgeHours(cam: Webcam): number {
  return (Date.now() - new Date(cam.time).getTime()) / 3_600_000;
}

export function isLive(cam: Webcam): boolean {
  return webcamAgeHours(cam) <= LIVE_MAX_AGE_HOURS;
}

/** Webcams Skaping d'une station : d'abord celles en direct, dans l'ordre défini pour la station. */
export function stationWebcams(station: Station, index: WebcamIndex | null): Webcam[] {
  if (!index) return [];
  const cams = station.skaping.map((p) => index.webcams[p]).filter((c): c is Webcam => !!c);
  return [...cams.filter(isLive), ...cams.filter((c) => !isLive(c))];
}
