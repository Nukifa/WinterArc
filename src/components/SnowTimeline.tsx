import { StyleSheet, Text, View } from 'react-native';

import type { AltitudeConditions } from '@/api/openMeteo';
import { colors } from '@/theme';
import { shortDay } from '@/utils/format';

const HEIGHT = 90;

/** Chutes de neige des 7 derniers jours (gris) puis prévisions (bleu), au sommet. */
export function SnowTimeline({ cond }: { cond: AltitudeConditions }) {
  const items = [
    ...cond.history.map((h) => ({ date: h.date, cm: h.snowfallCm, past: true })),
    ...cond.days.map((d) => ({ date: d.date, cm: d.snowfallCm, past: false })),
  ];
  const max = Math.max(10, ...items.map((i) => i.cm));
  const pastTotal = Math.round(cond.history.reduce((a, h) => a + h.snowfallCm, 0));
  const nextTotal = Math.round(cond.days.reduce((a, d) => a + d.snowfallCm, 0));

  return (
    <View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          <Text style={[styles.dot, { color: colors.low }]}>■ </Text>7 derniers jours : <Text style={styles.strong}>{pastTotal} cm</Text>
        </Text>
        <Text style={styles.legendText}>
          <Text style={[styles.dot, { color: colors.snow }]}>■ </Text>{cond.days.length} prochains jours :{' '}
          <Text style={styles.strong}>{nextTotal} cm</Text>
        </Text>
      </View>
      <View style={styles.chart}>
        {items.map((it, i) => {
          const h = it.cm > 0 ? Math.max(3, (it.cm / max) * HEIGHT) : 2;
          const isToday = !it.past && i === cond.history.length;
          return (
            <View key={it.date} style={[styles.col, isToday && styles.today]}>
              <Text style={styles.value}>{it.cm >= 1 ? Math.round(it.cm) : ''}</Text>
              <View style={{ height: HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                <View
                  style={[
                    styles.bar,
                    { height: h, backgroundColor: it.cm <= 0 ? colors.border : it.past ? colors.low : colors.snow },
                  ]}
                />
              </View>
              <Text style={[styles.day, isToday && styles.todayText]}>{isToday ? 'Auj.' : shortDay(it.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  legendText: { fontSize: 12, color: colors.muted },
  dot: { fontSize: 12 },
  strong: { color: colors.text, fontWeight: '700' },
  chart: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 6 },
  today: { backgroundColor: colors.primarySoft },
  bar: { width: '55%', maxWidth: 18, borderRadius: 3 },
  value: { fontSize: 10, color: colors.muted, height: 13 },
  day: { fontSize: 10, color: colors.muted, marginTop: 3 },
  todayText: { color: colors.primary, fontWeight: '700' },
});
