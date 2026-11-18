export type Webcam = {
  label: string;
  url: string;
};

export type Station = {
  id: string;
  name: string;
  massif: string;
  lat: number;
  lon: number;
  /** Altitude du bas du domaine (m) */
  altBase: number;
  /** Altitude du sommet du domaine (m) */
  altTop: number;
  /**
   * Postes du réseau nivo-météorologique Météo-France (relevés mesurés) situés dans
   * ou tout près du domaine. Vide si aucun poste n'est suffisamment proche.
   */
  nivoIds: string[];
  website: string;
  webcams: Webcam[];
};

export const GRENOBLE = { lat: 45.1885, lon: 5.7245 };

/** Rayon (km) en dessous duquel une station est considérée "autour de Grenoble". */
export const GRENOBLE_RADIUS_KM = 65;

/**
 * Coordonnées et altitudes approximatives (front de neige / sommet du domaine).
 * Les liens webcams pointent vers les pages webcams officielles des stations ;
 * ils peuvent changer d'une saison à l'autre : à vérifier / compléter.
 */
export const STATIONS: Station[] = [
  // --- Belledonne ---
  {
    id: 'chamrousse',
    name: 'Chamrousse',
    massif: 'Belledonne',
    lat: 45.1255,
    lon: 5.8775,
    altBase: 1650,
    altTop: 2253,
    nivoIds: ['7902'],
    website: 'https://www.chamrousse.com',
    webcams: [{ label: 'Webcams Chamrousse', url: 'https://www.chamrousse.com/webcams.html' }],
  },
  {
    id: '7laux',
    name: 'Les 7 Laux',
    massif: 'Belledonne',
    lat: 45.2766,
    lon: 6.0283,
    altBase: 1350,
    altTop: 2400,
    nivoIds: ['7872'],
    website: 'https://www.les7laux.com',
    webcams: [{ label: 'Webcams Les 7 Laux', url: 'https://www.les7laux.com/webcams' }],
  },
  {
    id: 'collet',
    name: "Le Collet d'Allevard",
    massif: 'Belledonne',
    lat: 45.3926,
    lon: 6.1203,
    altBase: 1450,
    altTop: 2100,
    nivoIds: ['7877'],
    website: 'https://www.lecollet.com',
    webcams: [{ label: 'Webcams Le Collet', url: 'https://www.lecollet.com/webcams' }],
  },
  // --- Vercors ---
  {
    id: 'villard-correncon',
    name: 'Villard-de-Lans / Corrençon',
    massif: 'Vercors',
    lat: 45.0503,
    lon: 5.5545,
    altBase: 1160,
    altTop: 2050,
    nivoIds: ['7886'],
    website: 'https://www.villarddelans-correncon.com',
    webcams: [
      { label: 'Webcams Villard / Corrençon', url: 'https://www.villarddelans-correncon.com/webcams' },
    ],
  },
  {
    id: 'lans',
    name: 'Lans-en-Vercors',
    massif: 'Vercors',
    lat: 45.1035,
    lon: 5.5735,
    altBase: 1400,
    altTop: 1807,
    nivoIds: [],
    website: 'https://www.lansenvercors.com',
    webcams: [{ label: 'Webcams Lans-en-Vercors', url: 'https://www.lansenvercors.com/webcams' }],
  },
  {
    id: 'autrans-meaudre',
    name: 'Autrans-Méaudre',
    massif: 'Vercors',
    lat: 45.1755,
    lon: 5.5415,
    altBase: 1050,
    altTop: 1710,
    nivoIds: [],
    website: 'https://www.autrans-meaudre.com',
    webcams: [{ label: 'Webcams Autrans-Méaudre', url: 'https://www.autrans-meaudre.com/webcams' }],
  },
  {
    id: 'gresse',
    name: 'Gresse-en-Vercors',
    massif: 'Vercors',
    lat: 44.8985,
    lon: 5.5625,
    altBase: 1250,
    altTop: 1750,
    nivoIds: ['7818'],
    website: 'https://www.gresse-en-vercors.fr',
    webcams: [{ label: 'Webcams Gresse', url: 'https://www.gresse-en-vercors.fr/webcams' }],
  },
  // --- Chartreuse ---
  {
    id: 'st-pierre-chartreuse',
    name: 'Saint-Pierre-de-Chartreuse',
    massif: 'Chartreuse',
    lat: 45.3405,
    lon: 5.8135,
    altBase: 900,
    altTop: 1800,
    nivoIds: [],
    website: 'https://www.st-pierre-chartreuse.com',
    webcams: [
      { label: 'Webcams St-Pierre-de-Chartreuse', url: 'https://www.st-pierre-chartreuse.com/webcams' },
    ],
  },
  {
    id: 'col-de-porte',
    name: 'Col de Porte',
    massif: 'Chartreuse',
    lat: 45.2925,
    lon: 5.7685,
    altBase: 1326,
    altTop: 1700,
    nivoIds: [],
    website: 'https://www.chartreuse-tourisme.com',
    webcams: [{ label: 'Webcams Chartreuse', url: 'https://www.chartreuse-tourisme.com/webcams' }],
  },
  // --- Matheysine / Trièves ---
  {
    id: 'alpe-grand-serre',
    name: "L'Alpe du Grand Serre",
    massif: 'Taillefer',
    lat: 45.0235,
    lon: 5.8595,
    altBase: 1368,
    altTop: 2200,
    nivoIds: ['7882'],
    website: 'https://www.alpedugrandserre.info',
    webcams: [{ label: 'Webcams Grand Serre', url: 'https://www.alpedugrandserre.info/webcams' }],
  },
  // --- Oisans ---
  {
    id: 'alpe-huez',
    name: "Alpe d'Huez",
    massif: 'Oisans',
    lat: 45.0915,
    lon: 6.0685,
    altBase: 1250,
    altTop: 3330,
    nivoIds: ['7811', '7875'],
    website: 'https://www.alpedhuez.com',
    webcams: [{ label: "Webcams Alpe d'Huez", url: 'https://www.alpedhuez.com/fr/webcams' }],
  },
  {
    id: 'vaujany',
    name: 'Vaujany / Oz',
    massif: 'Oisans',
    lat: 45.1575,
    lon: 6.0785,
    altBase: 1250,
    altTop: 3330,
    nivoIds: ['7920'],
    website: 'https://www.vaujany.com',
    webcams: [{ label: 'Webcams Vaujany', url: 'https://www.vaujany.com/webcams' }],
  },
  {
    id: '2alpes',
    name: 'Les 2 Alpes',
    massif: 'Oisans',
    lat: 45.0085,
    lon: 6.1225,
    altBase: 1300,
    altTop: 3600,
    nivoIds: ['7881'],
    website: 'https://www.les2alpes.com',
    webcams: [{ label: 'Webcams Les 2 Alpes', url: 'https://www.les2alpes.com/webcams/' }],
  },
  {
    id: 'la-grave',
    name: 'La Grave - La Meije',
    massif: 'Oisans',
    lat: 45.0455,
    lon: 6.3065,
    altBase: 1450,
    altTop: 3550,
    nivoIds: ['7915'],
    website: 'https://www.lagrave-lameije.com',
    webcams: [{ label: 'Webcams La Grave', url: 'https://www.lagrave-lameije.com/webcams' }],
  },
  // --- Maurienne ---
  {
    id: 'valloire',
    name: 'Valloire / Valmeinier',
    massif: 'Maurienne',
    lat: 45.1655,
    lon: 6.4295,
    altBase: 1430,
    altTop: 2600,
    nivoIds: ['7922'],
    website: 'https://www.valloire.net',
    webcams: [{ label: 'Webcams Valloire', url: 'https://www.valloire.net/webcams/' }],
  },
  // --- Tarentaise ---
  {
    id: 'val-thorens',
    name: 'Val Thorens',
    massif: 'Tarentaise',
    lat: 45.2975,
    lon: 6.5805,
    altBase: 2300,
    altTop: 3230,
    nivoIds: ['7918'],
    website: 'https://www.valthorens.com',
    webcams: [{ label: 'Webcams Val Thorens', url: 'https://www.valthorens.com/webcams/' }],
  },
  {
    id: 'meribel',
    name: 'Méribel',
    massif: 'Tarentaise',
    lat: 45.3965,
    lon: 6.5655,
    altBase: 1450,
    altTop: 2952,
    nivoIds: ['7892'],
    website: 'https://www.meribel.net',
    webcams: [{ label: 'Webcams Méribel', url: 'https://www.meribel.net/webcams/' }],
  },
  {
    id: 'courchevel',
    name: 'Courchevel',
    massif: 'Tarentaise',
    lat: 45.4155,
    lon: 6.6345,
    altBase: 1300,
    altTop: 2738,
    nivoIds: ['7893'],
    website: 'https://www.courchevel.com',
    webcams: [{ label: 'Webcams Courchevel', url: 'https://www.courchevel.com/fr/webcams' }],
  },
  {
    id: 'la-plagne',
    name: 'La Plagne',
    massif: 'Tarentaise',
    lat: 45.5065,
    lon: 6.6775,
    altBase: 1250,
    altTop: 3250,
    nivoIds: ['7895'],
    website: 'https://www.la-plagne.com',
    webcams: [{ label: 'Webcams La Plagne', url: 'https://www.la-plagne.com/webcams' }],
  },
  {
    id: 'les-arcs',
    name: 'Les Arcs',
    massif: 'Tarentaise',
    lat: 45.5725,
    lon: 6.8285,
    altBase: 1200,
    altTop: 3226,
    nivoIds: ['7900'],
    website: 'https://www.lesarcs.com',
    webcams: [{ label: 'Webcams Les Arcs', url: 'https://www.lesarcs.com/webcams' }],
  },
  {
    id: 'tignes',
    name: 'Tignes',
    massif: 'Tarentaise',
    lat: 45.4685,
    lon: 6.9065,
    altBase: 1550,
    altTop: 3456,
    nivoIds: ['7904'],
    website: 'https://www.tignes.net',
    webcams: [{ label: 'Webcams Tignes', url: 'https://www.tignes.net/webcams' }],
  },
  {
    id: 'val-isere',
    name: "Val d'Isère",
    massif: 'Tarentaise',
    lat: 45.4485,
    lon: 6.9805,
    altBase: 1785,
    altTop: 3456,
    nivoIds: ['7498'],
    website: 'https://www.valdisere.com',
    webcams: [{ label: "Webcams Val d'Isère", url: 'https://www.valdisere.com/webcams/' }],
  },
  // --- Haute-Savoie ---
  {
    id: 'la-clusaz',
    name: 'La Clusaz',
    massif: 'Aravis',
    lat: 45.9045,
    lon: 6.4235,
    altBase: 1100,
    altTop: 2600,
    nivoIds: ['7887'],
    website: 'https://www.laclusaz.com',
    webcams: [{ label: 'Webcams La Clusaz', url: 'https://www.laclusaz.com/webcams.html' }],
  },
  {
    id: 'chamonix',
    name: 'Chamonix',
    massif: 'Mont-Blanc',
    lat: 45.9235,
    lon: 6.8695,
    altBase: 1035,
    altTop: 3275,
    nivoIds: ['7470'],
    website: 'https://www.chamonix.com',
    webcams: [{ label: 'Webcams Chamonix', url: 'https://www.chamonix.com/webcams' }],
  },
  {
    id: 'avoriaz',
    name: 'Avoriaz',
    massif: 'Portes du Soleil',
    lat: 46.1915,
    lon: 6.7735,
    altBase: 1100,
    altTop: 2466,
    nivoIds: ['7858'],
    website: 'https://www.avoriaz.com',
    webcams: [{ label: 'Webcams Avoriaz', url: 'https://www.avoriaz.com/webcams.html' }],
  },
  // --- Hautes-Alpes ---
  {
    id: 'serre-chevalier',
    name: 'Serre Chevalier',
    massif: 'Briançonnais',
    lat: 44.9465,
    lon: 6.5585,
    altBase: 1200,
    altTop: 2800,
    nivoIds: ['7926', '7925'],
    website: 'https://www.serre-chevalier.com',
    webcams: [{ label: 'Webcams Serre Chevalier', url: 'https://www.serre-chevalier.com/fr/webcams' }],
  },
  {
    id: 'montgenevre',
    name: 'Montgenèvre',
    massif: 'Briançonnais',
    lat: 44.9315,
    lon: 6.7245,
    altBase: 1860,
    altTop: 2700,
    nivoIds: ['7575'],
    website: 'https://www.montgenevre.com',
    webcams: [{ label: 'Webcams Montgenèvre', url: 'https://www.montgenevre.com/webcams' }],
  },
  {
    id: 'vars-risoul',
    name: 'Vars / Risoul',
    massif: 'Queyras / Embrunais',
    lat: 44.5715,
    lon: 6.6835,
    altBase: 1650,
    altTop: 2750,
    nivoIds: ['7929'],
    website: 'https://www.vars.com',
    webcams: [{ label: 'Webcams Vars', url: 'https://www.vars.com/webcams' }],
  },
];

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceFromGrenoble(s: Station): number {
  return distanceKm(GRENOBLE, s);
}

export function getStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}
