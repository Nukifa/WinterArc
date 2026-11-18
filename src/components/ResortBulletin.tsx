import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { openTotal, STATUS_LABEL, upcomingOpening, type ResortReport } from '@/api/resorts';
import { colors, radius } from '@/theme';
import { cm, longDate, relativeDateTime } from '@/utils/format';

const LEVELS = [
  { key: 'beginner', label: 'Vertes', color: '#2E9E4F' },
  { key: 'intermediate', label: 'Bleues', color: '#1E6FD9' },
  { key: 'advanced', label: 'Rouges', color: '#D93025' },
  { key: 'expert', label: 'Noires', color: '#1F2937' },
] as const;

/** Bulletin déclaré par la station : ouverture, domaine, neige, horaires. */
export function ResortBulletin({ resort }: { resort: ResortReport }) {
  const isOpen = resort.status === 'open';
  const opening = upcomingOpening(resort);
  const reportedSnow = [resort.snow.base, resort.snow.middle, resort.snow.summit].some((v) => v !== null && v > 0);
  const fresh = resort.snow.last72 ?? 0;
  const day = resort.schedule.find((s) => !s.night);
  const night = resort.schedule.filter((s) => s.night);

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <Text style={[styles.status, isOpen ? styles.statusOpen : styles.statusClosed]}>
          {isOpen ? '● ' : ''}
          {STATUS_LABEL[resort.status]}
        </Text>
        {resort.updatedAt ? (
          <Text style={styles.small}>Bulletin {relativeDateTime(resort.updatedAt)}</Text>
        ) : null}
      </View>

      {opening ? (
        <Text style={styles.big}>
          Ouverture prévue le {longDate(opening)}
        </Text>
      ) : null}
      {resort.closingDate && (isOpen || opening) ? (
        <Text style={styles.small}>Fermeture prévue le {longDate(resort.closingDate)}</Text>
      ) : null}

      <View style={styles.grid}>
        <Stat label="Remontées" value={isOpen ? openTotal(resort.lifts) : resort.lifts.total} suffix={isOpen ? 'ouvertes' : ''} />
        <Stat label="Pistes" value={isOpen ? openTotal(resort.runs) : resort.runs.total} suffix={isOpen ? 'ouvertes' : ''} />
        <Stat
          label="Domaine"
          value={resort.km.total !== null ? `${isOpen && resort.km.open !== null ? `${resort.km.open}/` : ''}${resort.km.total}` : null}
          suffix="km"
        />
      </View>

      {LEVELS.some((l) => resort.runsByLevel[l.key]?.total) ? (
        <View style={styles.levels}>
          {LEVELS.map((l) => {
            const v = resort.runsByLevel[l.key];
            if (!v?.total) return null;
            return (
              <View key={l.key} style={styles.level}>
                <View style={[styles.levelDot, { backgroundColor: l.color }]} />
                <Text style={styles.levelText}>
                  {v.total} {l.label.toLowerCase()}
                </Text>
              </View>
            );
          })}
          {resort.parks ? <Text style={styles.levelText}>· {resort.parks} snowpark{resort.parks > 1 ? 's' : ''}</Text> : null}
        </View>
      ) : null}

      {reportedSnow || fresh > 0 ? (
        <View style={styles.snowRow}>
          <Text style={styles.small}>Neige déclarée :</Text>
          {resort.snow.base ? <Text style={styles.snowItem}>bas {cm(resort.snow.base)}</Text> : null}
          {resort.snow.middle ? <Text style={styles.snowItem}>milieu {cm(resort.snow.middle)}</Text> : null}
          {resort.snow.summit ? <Text style={styles.snowItem}>sommet {cm(resort.snow.summit)}</Text> : null}
          {fresh > 0 ? <Text style={styles.snowItem}>fraîche 72 h {cm(fresh)}</Text> : null}
        </View>
      ) : null}

      {day ? (
        <Text style={styles.small}>
          🕘 Remontées {day.from}–{day.to}
          {night.length
            ? ` · ski de nuit ${night[0].from}–${night[0].to} (${night.length} soir${night.length > 1 ? 's' : ''} par semaine)`
            : ''}
        </Text>
      ) : null}

      <View style={styles.links}>
        {resort.trailMap ? (
          <Pressable onPress={() => Linking.openURL(resort.trailMap!)} hitSlop={6}>
            <Text style={styles.link}>🗺️ Plan des pistes ↗</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => Linking.openURL(resort.page)} hitSlop={6}>
          <Text style={styles.link}>Bulletin complet (Skiinfo) ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string | number | null; suffix?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.small}>{label}</Text>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      {suffix && value !== null ? <Text style={styles.small}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  status: { fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  statusOpen: { color: colors.high, backgroundColor: colors.okBg },
  statusClosed: { color: colors.muted, backgroundColor: colors.neutralBg },
  big: { fontSize: 16, fontWeight: '700', color: colors.text },
  small: { fontSize: 12, color: colors.muted },
  grid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stat: { flex: 1, backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  levels: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  level: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  levelText: { fontSize: 12, color: colors.text },
  snowRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  snowItem: { fontSize: 12, fontWeight: '700', color: colors.text },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
