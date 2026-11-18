const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shortDay(iso: string): string {
  return DAYS[parseDate(iso).getDay()];
}

export function longDay(iso: string, offset: number): string {
  if (offset === 0) return "Aujourd'hui";
  if (offset === 1) return 'Demain';
  const d = parseDate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

export function cm(v: number | null): string {
  return v === null ? '—' : `${v} cm`;
}

/** "17 nov." à partir d'une date ISO (UTC) */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "aujourd'hui à 13h21", "hier à 07h17" ou "16 nov. à 08h00" (heure locale) */
export function relativeDateTime(input: number | string): string {
  const d = new Date(input);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400_000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const day = sameDay(d, today) ? "aujourd'hui" : sameDay(d, yesterday) ? 'hier' : `le ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${day} à ${formatTime(d.getTime())}`;
}

/** "il y a 12 min", "il y a 3 h", sinon "le 6 avr." */
export function relativeAge(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`;
  return `le ${shortDate(iso)}`;
}

/** "samedi 5 décembre" à partir d'une date "YYYY-MM-DD" */
export function longDate(iso: string): string {
  const FULL_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const FULL_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const d = parseDate(iso.slice(0, 10));
  return `${FULL_DAYS[d.getDay()]} ${d.getDate()} ${FULL_MONTHS[d.getMonth()]}`;
}

/** "5 déc." à partir d'une date "YYYY-MM-DD" (sans décalage de fuseau) */
export function dayMonth(iso: string): string {
  const d = parseDate(iso.slice(0, 10));
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
