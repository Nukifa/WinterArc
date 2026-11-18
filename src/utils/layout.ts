import { useWindowDimensions } from 'react-native';

/** Largeur maximale du contenu sur grand écran (PC). */
export const MAX_CONTENT_WIDTH = 1240;
export const MAX_READING_WIDTH = 820;

/** Nombre de colonnes de cartes selon la largeur de la fenêtre. */
export function useColumns(): number {
  const { width } = useWindowDimensions();
  if (width >= 1100) return 3;
  if (width >= 720) return 2;
  return 1;
}
