import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { totalSnowfall } from '@/api/openMeteo';
import { STATUS_LABEL, stationResort, upcomingOpening } from '@/api/resorts';
import { currentReport } from '@/api/snowReports';
import { Chip } from '@/components/Chip';
import { StationsMap, type MapStation } from '@/components/StationsMap';
import { useConditions } from '@/data/ConditionsContext';
import { useFavorites } from '@/data/FavoritesContext';
import { STATIONS } from '@/data/stations';
import { colors } from '@/theme';
import { dayMonth } from '@/utils/format';

type Metric = 'forecast' | 'depth';

/** Échelles de couleur (du gris au bleu nuit) */
const FORECAST_SCALE: [number, string, string][] = [
  [30, '#0B3D91', '≥ 30 cm'],
  [15, '#1E6FD9', '15–30'],
  [5, '#5B9DF2', '5–15'],
  [1, '#8FB8EE', '1–5'],
  [-Infinity, '#8A97A8', '0'],
];
const DEPTH_SCALE: [number, string, string][] = [
  [150, '#0B3D91', '≥ 150 cm'],
  [80, '#1E6FD9', '80–150'],
  [40, '#5B9DF2', '40–80'],
  [10, '#8FB8EE', '10–40'],
  [-Infinity, '#8A97A8', '< 10'],
];
const colorFor = (scale: typeof FORECAST_SCALE, v: number) => scale.find(([min]) => v >= min)![1];

export default function MapScreen() {
  const { data, reports, resorts } = useConditions();
  const { favorites } = useFavorites();
  const [metric, setMetric] = useState<Metric>('forecast');
  const scale = metric === 'forecast' ? FORECAST_SCALE : DEPTH_SCALE;

  const stations: MapStation[] = useMemo(
    () =>
      STATIONS.map((s) => {
        const c = data[s.id];
        const report = currentReport(s, reports);
        const resort = stationResort(s, resorts);
        const forecast = c ? totalSnowfall(c.top.days) : null;
        const depth = report?.obs.snowDepthCm ?? c?.top.snowDepthCm ?? null;
        const value = metric === 'forecast' ? forecast : depth;
        const opening = resort ? upcomingOpening(resort) : null;
        return {
          id: s.id,
          name: s.name,
          massif: s.massif,
          lat: s.lat,
          lon: s.lon,
          label: value === null ? '…' : metric === 'forecast' ? `+${value}` : `${value}`,
          color: value === null ? '#8A97A8' : colorFor(scale, value),
          favorite: favorites.includes(s.id),
          details: [
            forecast !== null ? `❄️ +${forecast} cm prévus sur 5 jours` : '',
            depth !== null ? `📏 ${depth} cm au sommet (${report ? 'mesuré' : 'estimé'})` : '',
            resort
              ? resort.status === 'open'
                ? '🟢 Ouverte'
                : opening
                  ? `Ouverture prévue le ${dayMonth(opening)}`
                  : STATUS_LABEL[resort.status]
              : '',
            `${s.altBase}–${s.altTop} m`,
          ].filter(Boolean),
        };
      }),
    [data, reports, resorts, favorites, metric, scale],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="❄️ Neige prévue (5 j)" active={metric === 'forecast'} onPress={() => setMetric('forecast')} small />
          <Chip label="📏 Enneigement" active={metric === 'depth'} onPress={() => setMetric('depth')} small />
        </ScrollView>
        <View style={styles.legend}>
          {scale.map(([, color, label]) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <StationsMap stations={stations} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, backgroundColor: colors.bg },
  chips: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: colors.muted },
});
