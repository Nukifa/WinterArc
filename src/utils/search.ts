import type { Station } from '@/data/stations';

/** Minuscules, sans accents ni ponctuation : "Alpe d'Huez" -> "alpe d huez" */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Autres noms sous lesquels on cherche une station (villages, secteurs, domaines reliés). */
const ALIASES: Record<string, string> = {
  '7laux': 'sept laux prapoutel pipay pleynet',
  collet: 'allevard',
  'villard-correncon': 'villard de lans correncon',
  'autrans-meaudre': 'autrans meaudre',
  'st-pierre-chartreuse': 'saint pierre planolet',
  'alpe-grand-serre': 'grand serre',
  'alpe-huez': 'huez auris villard reculas grandes rousses',
  vaujany: 'oz en oisans grandes rousses',
  '2alpes': 'deux alpes',
  'la-grave': 'meije',
  valloire: 'valmeinier galibier',
  'val-thorens': 'trois vallees 3 vallees',
  meribel: 'mottaret trois vallees 3 vallees',
  courchevel: 'trois vallees 3 vallees la tania',
  'la-plagne': 'paradiski champagny montchavin les coches',
  'les-arcs': 'paradiski bourg saint maurice',
  tignes: 'espace killy',
  'val-isere': 'val d isere espace killy',
  chamonix: 'mont blanc flegere brevent balme grands montets',
  avoriaz: 'portes du soleil morzine',
  'serre-chevalier': 'briancon monetier chantemerle villeneuve',
  montgenevre: 'voie lactee',
  orcieres: 'merlette',
  devoluy: 'superdevoluy joue du loup',
  vars: 'foret blanche',
  risoul: 'foret blanche',
  abries: 'ristolas queyras',
  'st-veran': 'saint veran molines queyras',
  ceillac: 'queyras',
  'puy-st-vincent': 'puy saint vincent vallouise',
};

const index = new Map<string, string>();

function haystack(s: Station): string {
  let h = index.get(s.id);
  if (!h) {
    h = ` ${normalize([s.name, s.massif, s.departement, ALIASES[s.id] ?? ''].join(' '))} `;
    index.set(s.id, h);
  }
  return h;
}

/** Tous les mots de la recherche doivent apparaître (début de mot) dans le nom, le massif, le département ou les alias. */
export function matchesQuery(station: Station, query: string): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const h = haystack(station);
  return words.every((w) => h.includes(` ${w}`));
}
