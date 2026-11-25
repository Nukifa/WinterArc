import { Appearance, Platform } from 'react-native';

/** Palette claire (référence). */
const light = {
  bg: '#F2F6FB',
  card: '#FFFFFF',
  text: '#0F1B2D',
  muted: '#5B6B82',
  border: '#DCE4EF',
  primary: '#1E6FD9',
  primarySoft: '#E3EEFC',
  onPrimary: '#FFFFFF',
  snow: '#7FB3F5',
  high: '#1F9D55',
  medium: '#B87503',
  low: '#9AA5B5',
  danger: '#C0392B',
  star: '#F2A900',
  /** Fonds des badges */
  okBg: '#E2F5EA',
  warnBg: '#FDF3E1',
  neutralBg: '#EEF1F5',
  dangerBg: '#FDECEA',
  overlay: 'rgba(15,27,45,0.55)',
};

export type ThemeColors = typeof light;

/** Palette sombre. */
const dark: ThemeColors = {
  bg: '#0E1621',
  card: '#172231',
  text: '#E6EDF5',
  muted: '#93A3B8',
  border: '#263548',
  primary: '#5B9DF2',
  primarySoft: '#1B2D45',
  onPrimary: '#FFFFFF',
  snow: '#5FA0F0',
  high: '#45C985',
  medium: '#F0B140',
  low: '#5F6F84',
  danger: '#FF7A6E',
  star: '#F5B82E',
  okBg: '#153326',
  warnBg: '#3A2E14',
  neutralBg: '#223044',
  dangerBg: '#3D1F1F',
  overlay: 'rgba(5,10,18,0.65)',
};

const cssVar = (key: string) => `--c-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

/**
 * Mobile natif : le thème (clair / sombre) du téléphone est lu au lancement de l'app.
 * Les styles sont figés à ce moment-là ; un changement de thème système s'applique au lancement suivant.
 */
export const isDarkTheme = Platform.OS !== 'web' && Appearance.getColorScheme() === 'dark';

/**
 * Couleurs à utiliser dans les styles. Sur le web ce sont des variables CSS : le thème clair / sombre
 * change alors sans recalculer les styles (voir themeCss et ThemeContext). Sur mobile : palette du thème système.
 */
export const colors: ThemeColors =
  Platform.OS === 'web'
    ? (Object.fromEntries(Object.keys(light).map((k) => [k, `var(${cssVar(k)})`])) as ThemeColors)
    : isDarkTheme
      ? dark
      : light;

export const palettes = { light, dark };

const declarations = (p: ThemeColors) =>
  Object.entries(p)
    .map(([k, v]) => `${cssVar(k)}:${v};`)
    .join('');

/** Feuille de style des variables de couleur : thème système, ou forcé via <html data-theme="…">. */
export function themeCss(): string {
  return [
    `:root{${declarations(light)}color-scheme:light;}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${declarations(dark)}color-scheme:dark;}}`,
    `:root[data-theme="dark"]{${declarations(dark)}color-scheme:dark;}`,
    'html,body{background:var(--c-bg);}',
  ].join('\n');
}

export const radius = 14;
