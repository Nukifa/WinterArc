import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { totalSnowfall, type StationConditions } from '@/api/openMeteo';
import { currentReport, type LatestReport } from '@/api/snowReports';
import { Chip } from '@/components/Chip';
import { DataFreshness } from '@/components/DataFreshness';
import { SnowBars } from '@/components/SnowBars';
import { useConditions } from '@/data/ConditionsContext';
import { distanceFromGrenoble, GRENOBLE_RADIUS_KM, STATIONS, type Station } from '@/data/stations';
import { colors, radius } from '@/theme';
import { cm, shortDate } from '@/utils/format';

type Zone = 'grenoble' | 'all';
type Sort = 'distance' | 'forecast' | 'depth';

export default function StationsScreen() {
  const { data, reports, loading, error, refresh } = useConditions();
  const [zone, setZone] = useState<Zone>('grenoble');
  const [sort, setSort] = useState<Sort>('distance');

  const list = useMemo(() => {
    const withDist = STATIONS.map((s) => ({
      station: s,
      dist: distanceFromGrenoble(s),
      report: currentReport(s, reports),
    }));
    const depth = (x: (typeof withDist)[number]) =>
      x.report?.obs.snowDepthCm ?? data[x.station.id]?.top.snowDepthCm ?? -1;
    const filtered = zone === 'grenoble' ? withDist.filter((x) => x.dist <= GRENOBLE_RADIUS_KM) : withDist;
    return [...filtered].sort((a, b) => {
      if (sort === 'distance') return a.dist - b.dist;
      const ca = data[a.station.id];
      const cb = data[b.station.id];
      if (sort === 'forecast') return (cb ? totalSnowfall(cb.top.days) : -1) - (ca ? totalSnowfall(ca.top.days) : -1);
      return depth(b) - depth(a);
    });
  }, [zone, sort, data, reports]);

  return (
    <FlatList
      data={list}
      keyExtractor={(x) => x.station.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.chips}>
            <Chip label="📍 Autour de Grenoble" active={zone === 'grenoble'} onPress={() => setZone('grenoble')} />
            <Chip label="🏔️ Toutes les Alpes" active={zone === 'all'} onPress={() => setZone('all')} />
          </View>
          <View style={styles.chips}>
            <Text style={styles.sortLabel}>Trier :</Text>
            <Chip label="Distance" active={sort === 'distance'} onPress={() => setSort('distance')} />
            <Chip label="Neige à venir" active={sort === 'forecast'} onPress={() => setSort('forecast')} />
            <Chip label="Enneigement" active={sort === 'depth'} onPress={() => setSort('depth')} />
          </View>
          {error ? (
            <Pressable onPress={() => refresh(true)} style={styles.error}>
              <Text style={styles.errorText}>⚠️ {error} — toucher pour réessayer</Text>
            </Pressable>
          ) : null}
          <DataFreshness />
        </View>
      }
      renderItem={({ item }) => (
        <StationCard
          station={item.station}
          dist={item.dist}
          conditions={data[item.station.id]}
          report={item.report}
          loading={loading}
        />
      )}
      ListFooterComponent={
        <Text style={styles.footer}>
          « Mesuré » : relevé du réseau nivo-météorologique Météo-France (stations ouvertes). « Estimé » : modèle
          météo Open-Meteo. Prévisions limitées à 5 jours pour rester fiables.
        </Text>
      }
    />
  );
}

function StationCard({
  station,
  dist,
  conditions,
  report,
  loading,
}: {
  station: Station;
  dist: number;
  conditions?: StationConditions;
  report: LatestReport | null;
  loading: boolean;
}) {
  const total = conditions ? totalSnowfall(conditions.top.days) : null;
  return (
    <Link href={{ pathname: '/station/[id]', params: { id: station.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{station.name}</Text>
            <Text style={styles.meta}>
              {station.massif} · {Math.round(dist)} km · {station.altBase}–{station.altTop} m
            </Text>
          </View>
          {total !== null && total > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>+{total} cm</Text>
              <Text style={styles.badgeSub}>sur 5 j</Text>
            </View>
          ) : null}
        </View>

        {conditions || report ? (
          <View style={styles.cardBottom}>
            {report ? (
              <View style={styles.depths}>
                <Text style={[styles.tag, styles.tagMeasured]}>MESURÉ · {report.post.altitude} m</Text>
                <Text style={styles.depthValue}>{cm(report.obs.snowDepthCm)}</Text>
                <Text style={styles.depthLabel}>Météo-France · {shortDate(report.obs.time)}</Text>
              </View>
            ) : conditions ? (
              <View style={styles.depths}>
                <Text style={[styles.tag, styles.tagModel]}>ESTIMÉ · sommet</Text>
                <Text style={styles.depthValue}>{cm(conditions.top.snowDepthCm)}</Text>
                <Text style={styles.depthLabel}>Bas · {cm(conditions.base.snowDepthCm)}</Text>
              </View>
            ) : (
              <View />
            )}
            {conditions ? <SnowBars days={conditions.top.days} /> : null}
          </View>
        ) : loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.primary} />
        ) : (
          <Text style={[styles.meta, { marginTop: 10 }]}>Données indisponibles</Text>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  header: { gap: 10, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  sortLabel: { color: colors.muted, fontSize: 13 },
  error: { backgroundColor: '#FDECEA', padding: 10, borderRadius: 10 },
  errorText: { color: colors.danger, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  badgeText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  badgeSub: { color: colors.primary, fontSize: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  depths: { gap: 1 },
  depthLabel: { fontSize: 11, color: colors.muted },
  tag: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, alignSelf: 'flex-start', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  tagMeasured: { color: colors.high, backgroundColor: '#E2F5EA' },
  tagModel: { color: colors.muted, backgroundColor: '#EEF1F5' },
  depthValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  footer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
