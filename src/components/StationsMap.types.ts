export type MapStation = {
  id: string;
  name: string;
  massif: string;
  lat: number;
  lon: number;
  /** Valeur affichée dans le repère (ex. "+23") */
  label: string;
  /** Couleur du repère */
  color: string;
  /** Lignes d'information de la bulle */
  details: string[];
  favorite: boolean;
};
