import { StyleSheet, Text, View } from 'react-native';

import { useConditions } from '@/data/ConditionsContext';
import { colors } from '@/theme';
import { relativeDateTime } from '@/utils/format';

/** Indique quand les données météo et les relevés ont été actualisés. */
export function DataFreshness() {
  const { reports, resorts, webcams, forecastAt, loading } = useConditions();

  const lastObs = reports
    ? Object.values(reports.posts)
        .flatMap((p) => p.obs.map((o) => o.time))
        .sort()
        .at(-1)
    : undefined;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>🕒 Dernière actualisation{loading ? ' (en cours…)' : ''}</Text>
      <Text style={styles.line}>
        <Text style={styles.label}>Prévisions météo : </Text>
        {forecastAt ? relativeDateTime(forecastAt) : 'pas encore chargées'}
        <Text style={styles.src}> · Open-Meteo</Text>
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>Relevés de neige : </Text>
        {reports ? `publiés ${relativeDateTime(reports.generatedAt)}` : 'pas encore chargés'}
        {lastObs ? ` (dernière mesure ${relativeDateTime(lastObs)})` : ''}
        <Text style={styles.src}> · Météo-France</Text>
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>Ouvertures et pistes : </Text>
        {resorts ? `bulletins des stations repris ${relativeDateTime(resorts.generatedAt)}` : 'pas encore chargés'}
        <Text style={styles.src}> · Skiinfo</Text>
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>Webcams : </Text>
        {webcams ? `images indexées ${relativeDateTime(webcams.generatedAt)}` : 'pas encore chargées'}
        <Text style={styles.src}> · Skaping</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  title: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  line: { fontSize: 12, color: colors.text },
  label: { fontWeight: '600' },
  src: { color: colors.muted },
});
