import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { totalSnowfall, type StationConditions } from '@/api/openMeteo';
import { currentReport, type LatestReport } from '@/api/snowReports';
import { isLive, stationWebcams, type Webcam } from '@/api/webcams';
import { Chip } from '@/components/Chip';
import { DataFreshness } from '@/components/DataFreshness';
import { SnowBars } from '@/components/SnowBars';
import { StarButton } from '@/components/StarButton';
import { useConditions } from '@/data/ConditionsContext';
import { useFavorites } from '@/data/FavoritesContext';
import {
  DEPARTEMENTS,
  distanceFromGrenoble,
  GRENOBLE_RADIUS_KM,
  STATIONS,
  type Departement,
  type Station,
} from '@/data/stations';
import { colors, radius } from '@/theme';
import { cm, relativeAge, shortDate } from '@/utils/format';
import { MAX_CONTENT_WIDTH, useColumns } from '@/utils/layout';

type Zone = 'favorites' | 'grenoble' | 'all' | Departement;
type Sort = 'distance' | 'forecast' | 'depth';

const ZONES: { key: Zone; label: string }[] = [
  { key: 'favorites', label: '⭐ Favoris' },
  { key: 'grenoble', label: '📍 Autour de Grenoble' },
  ...DEPARTEMENTS.map((d) => ({ key: d as Zone, label: d })),
  { key: 'all', label: '🏔️ Toutes' },
];

function inZone(s: Station, zone: Zone, favorites: string[]): boolean {
  if (zone === 'favorites') return favorites.includes(s.id);
  if (zone === 'grenoble') return distanceFromGrenoble(s) <= GRENOBLE_RADIUS_KM;
  if (zone === 'all') return true;
  return s.departement === zone;
}

export default function StationsScreen() {
  const { data, reports, webcams, loading, error, refresh } = useConditions();
  const { favorites, ready } = useFavorites();
  // Au démarrage, l'app s'ouvre sur les favoris s'il y en a, sinon autour de Grenoble
  const [chosenZone, setZone] = useState<Zone | null>(null);
  const zone: Zone = chosenZone ?? (ready && favorites.length > 0 ? 'favorites' : 'grenoble');
  const [massif, setMassif] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('distance');
  const columns = useColumns();


  const zoneStations = useMemo(() => STATIONS.filter((s) => inZone(s, zone, favorites)), [zone, favorites]);

  // Massifs disponibles dans la zone choisie, du plus proche au plus loin de Grenoble
  const massifs = useMemo(() => {
    const best = new Map<string, number>();
    zoneStations.forEach((s) => {
      const d = distanceFromGrenoble(s);
      best.set(s.massif, Math.min(best.get(s.massif) ?? Infinity, d));
    });
    return [...best.entries()].sort((a, b) => a[1] - b[1]).map(([m]) => m);
  }, [zoneStations]);

  const activeMassif = massif && massifs.includes(massif) ? massif : null;

  const list = useMemo(() => {
    const items = zoneStations
      .filter((s) => !activeMassif || s.massif === activeMassif)
      .map((s) => ({
        station: s,
        dist: distanceFromGrenoble(s),
        report: currentReport(s, reports),
        cam: stationWebcams(s, webcams).find(isLive),
      }));
    const depth = (x: (typeof items)[number]) => x.report?.obs.snowDepthCm ?? data[x.station.id]?.top.snowDepthCm ?? -1;
    return items.sort((a, b) => {
      if (sort === 'distance') return a.dist - b.dist;
      const ca = data[a.station.id];
      const cb = data[b.station.id];
      if (sort === 'forecast') return (cb ? totalSnowfall(cb.top.days) : -1) - (ca ? totalSnowfall(ca.top.days) : -1);
      return depth(b) - depth(a);
    });
  }, [zoneStations, activeMassif, sort, data, reports, webcams]);

  // Sur plusieurs colonnes, on complète la dernière ligne pour garder des cartes de même largeur
  const rows: (typeof list[number] | null)[] = [...list];
  while (columns > 1 && rows.length % columns !== 0) rows.push(null);

  return (
    <FlatList
      key={`cols-${columns}`}
      data={rows}
      numColumns={columns}
      keyExtractor={(x, i) => x?.station.id ?? `empty-${i}`}
      contentContainerStyle={styles.content}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {ZONES.map((z) => (
              <Chip
                key={z.key}
                label={z.key === 'favorites' && favorites.length ? `${z.label} (${favorites.length})` : z.label}
                active={zone === z.key}
                onPress={() => {
                  setZone(z.key);
                  setMassif(null);
                }}
              />
            ))}
          </ScrollView>
          {massifs.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Text style={styles.sortLabel}>Massif :</Text>
              <Chip label="Tous" active={!activeMassif} onPress={() => setMassif(null)} small />
              {massifs.map((m) => (
                <Chip key={m} label={m} active={activeMassif === m} onPress={() => setMassif(m)} small />
              ))}
            </ScrollView>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Text style={styles.sortLabel}>Trier :</Text>
            <Chip label="Distance" active={sort === 'distance'} onPress={() => setSort('distance')} small />
            <Chip label="Neige à venir" active={sort === 'forecast'} onPress={() => setSort('forecast')} small />
            <Chip label="Enneigement" active={sort === 'depth'} onPress={() => setSort('depth')} small />
          </ScrollView>
          {error ? (
            <Pressable onPress={() => refresh(true)} style={styles.error}>
              <Text style={styles.errorText}>⚠️ {error} — toucher pour réessayer</Text>
            </Pressable>
          ) : null}
          <DataFreshness />
        </View>
      }
      ListEmptyComponent={
        zone === 'favorites' ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucune station favorite</Text>
            <Text style={styles.emptyText}>
              Touchez l’étoile ☆ d’une station pour la retrouver ici. L’app s’ouvrira directement sur vos favoris.
            </Text>
            <Chip label="Voir les stations autour de Grenoble" active onPress={() => setZone('grenoble')} />
          </View>
        ) : undefined
      }
      renderItem={({ item }) =>
        item ? (
          <View style={styles.cell}>
            <StationCard
              station={item.station}
              dist={item.dist}
              conditions={data[item.station.id]}
              report={item.report}
              cam={item.cam}
              loading={loading}
            />
          </View>
        ) : (
          <View style={styles.cell} />
        )
      }
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
  cam,
  loading,
}: {
  station: Station;
  dist: number;
  conditions?: StationConditions;
  report: LatestReport | null;
  cam?: Webcam;
  loading: boolean;
}) {
  const total = conditions ? totalSnowfall(conditions.top.days) : null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/station/[id]', params: { id: station.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
        {cam ? (
          <View style={styles.banner}>
            <Image source={{ uri: cam.thumb }} style={styles.bannerImg} resizeMode="cover" accessibilityLabel={cam.label} />
            <Text style={styles.bannerTag}>● Webcam · {relativeAge(cam.time)}</Text>
          </View>
        ) : null}
        <View style={styles.cardTop}>
          <StarButton stationId={station.id} />
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
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  row: { gap: 12 },
  cell: { flex: 1, minWidth: 0 },
  header: { gap: 10, marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingRight: 16 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  sortLabel: { color: colors.muted, fontSize: 13 },
  error: { backgroundColor: '#FDECEA', padding: 10, borderRadius: 10 },
  errorText: { color: colors.danger, fontSize: 13 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: { marginTop: -14, marginHorizontal: -14, marginBottom: 12, height: 74, backgroundColor: colors.bg },
  bannerImg: { width: '100%', height: '100%', borderTopLeftRadius: radius, borderTopRightRadius: radius },
  bannerTag: {
    position: 'absolute',
    left: 8,
    bottom: 6,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(15,27,45,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
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
