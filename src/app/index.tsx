import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { totalSnowfall, type StationConditions } from '@/api/openMeteo';
import { Chip } from '@/components/Chip';
import { SnowBars } from '@/components/SnowBars';
import { useConditions } from '@/data/ConditionsContext';
import { distanceFromGrenoble, GRENOBLE_RADIUS_KM, STATIONS, type Station } from '@/data/stations';
import { colors, radius } from '@/theme';
import { cm, formatTime } from '@/utils/format';

type Zone = 'grenoble' | 'all';
type Sort = 'distance' | 'forecast' | 'depth';

export default function StationsScreen() {
  const { data, loading, error, updatedAt, refresh } = useConditions();
  const [zone, setZone] = useState<Zone>('grenoble');
  const [sort, setSort] = useState<Sort>('distance');

  const list = useMemo(() => {
    const withDist = STATIONS.map((s) => ({ station: s, dist: distanceFromGrenoble(s) }));
    const filtered = zone === 'grenoble' ? withDist.filter((x) => x.dist <= GRENOBLE_RADIUS_KM) : withDist;
    return [...filtered].sort((a, b) => {
      if (sort === 'distance') return a.dist - b.dist;
      const ca = data[a.station.id];
      const cb = data[b.station.id];
      if (sort === 'forecast') return (cb ? totalSnowfall(cb.top.days) : -1) - (ca ? totalSnowfall(ca.top.days) : -1);
      return (cb?.top.snowDepthCm ?? -1) - (ca?.top.snowDepthCm ?? -1);
    });
  }, [zone, sort, data]);

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
          {updatedAt ? <Text style={styles.updated}>Mis à jour à {formatTime(updatedAt)} · Open-Meteo</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <StationCard station={item.station} dist={item.dist} conditions={data[item.station.id]} loading={loading} />
      )}
      ListFooterComponent={
        <Text style={styles.footer}>
          Hauteurs de neige estimées par modèle météo (non officielles). Prévisions limitées à 5 jours pour rester
          fiables.
        </Text>
      }
    />
  );
}

function StationCard({
  station,
  dist,
  conditions,
  loading,
}: {
  station: Station;
  dist: number;
  conditions?: StationConditions;
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

        {conditions ? (
          <View style={styles.cardBottom}>
            <View style={styles.depths}>
              <Text style={styles.depthLabel}>Sommet</Text>
              <Text style={styles.depthValue}>{cm(conditions.top.snowDepthCm)}</Text>
              <Text style={styles.depthLabel}>Bas · {cm(conditions.base.snowDepthCm)}</Text>
            </View>
            <SnowBars days={conditions.top.days} />
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
  updated: { color: colors.muted, fontSize: 12 },
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
  depthValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  footer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
