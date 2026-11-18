import { StyleSheet, Text, View } from 'react-native';

import type { DayForecast } from '@/api/openMeteo';
import { colors } from '@/theme';
import { shortDay } from '@/utils/format';

/** Mini histogramme des chutes de neige prévues. */
export function SnowBars({ days, height = 36 }: { days: DayForecast[]; height?: number }) {
  const max = Math.max(10, ...days.map((d) => d.snowfallCm));
  return (
    <View style={styles.row}>
      {days.map((d) => {
        const h = d.snowfallCm > 0 ? Math.max(3, (d.snowfallCm / max) * height) : 2;
        return (
          <View key={d.date} style={styles.col}>
            <Text style={styles.value}>{d.snowfallCm >= 1 ? Math.round(d.snowfallCm) : ''}</Text>
            <View style={{ height, justifyContent: 'flex-end' }}>
              <View
                style={[styles.bar, { height: h, backgroundColor: d.snowfallCm > 0 ? colors.snow : colors.border }]}
              />
            </View>
            <Text style={styles.day}>{shortDay(d.date)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  col: { alignItems: 'center', width: 30 },
  bar: { width: 16, borderRadius: 4 },
  value: { fontSize: 10, color: colors.muted, height: 13 },
  day: { fontSize: 10, color: colors.muted, marginTop: 3 },
});
