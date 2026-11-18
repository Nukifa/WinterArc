/**
 * Adresse publique du site (voir site.config.json et scripts/site.mjs).
 * Les valeurs sont injectées au build par GitHub Actions ; à défaut : GitHub Pages.
 */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://nukifa.github.io/WinterArc';
export const BASE_PATH = process.env.EXPO_PUBLIC_BASE_PATH ?? '/WinterArc';
