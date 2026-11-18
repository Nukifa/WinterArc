import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { weatherInfo } from '@/api/openMeteo';
import { stationResort } from '@/api/resorts';
import { Chip } from '@/components/Chip';
import { StarButton } from '@/components/StarButton';
import { useConditions } from '@/data/ConditionsContext';
import { useFavorites } from '@/data/FavoritesContext';
import { distanceFromGrenoble, GRENOBLE_RADIUS_KM, STATIONS } from '@/data/stations';
import { colors, radius } from '@/theme';
import { dayMonth, longDate } from '@/utils/format';
import { MAX_READING_WIDTH } from '@/utils/layout';
import { nextWeekend, rankStation, type Ranked } from '@/utils/weekend';

type Zone = 'grenoble' | 'all' | 'favorites';
const MEDALS = ['🥇', '🥈', '🥉'];

export default function WeekendScreen() {
  const { data, reports, resorts, loading, refresh } = useConditions();
  const { favorites } = useFavorites();
  const [zone, setZone] = useState<Zone>('grenoble');
  const [includeClosed, setIncludeClosed] = useState(false);
  const weekend = useMemo(() => nextWeekend(), []);

  const { ranked, closed } = useMemo(() => {
    if (weekend.offsets.length === 0) return { ranked: [] as Ranked[], closed: 0 };
    const all = STATIONS.filter((s) =>
      zone === 'favorites'
        ? favorites.includes(s.id)
        : zone === 'grenoble'
          ? distanceFromGrenoble(s) <= GRENOBLE_RADIUS_KM
          : true,
    )
      .filter((s) => data[s.id])
      .map((s) => rankStation(s, data[s.id], stationResort(s, resorts), reports, weekend));
    const visible = all.filter((r) => includeClosed || r.openOnWeekend !== false);
    return {
      ranked: visible.sort((a, b) => b.score - a.score),
      closed: all.length - all.filter((r) => r.openOnWeekend !== false).length,
    };
  }, [data, reports, resorts, weekend, zone, favorites, includeClosed]);

  const title =
    weekend.dates.length === 0
      ? ''
      : weekend.dates.length === 1
        ? longDate(weekend.dates[0])
        : `${longDate(weekend.dates[0])} et ${longDate(weekend.dates[1])}`;

  return (
    <FlatList
      data={ranked}
      keyExtractor={(r) => r.station.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {weekend.dates.length ? (
            <Text style={styles.period}>📅 {title.charAt(0).toUpperCase() + title.slice(1)}</Text>
          ) : null}
          {weekend.missing.length ? (
            <Text style={styles.note}>
              {weekend.dates.length
                ? `Le ${longDate(weekend.missing[0])} est encore trop loin pour une prévision fiable : classement sur ${longDate(weekend.dates[0])} uniquement.`
                : 'Le week-end est encore trop loin pour des prévisions de neige fiables. Le classement sera disponible à partir de mardi.'}
            </Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="📍 Autour de Grenoble" active={zone === 'grenoble'} onPress={() => setZone('grenoble')} small />
            <Chip label="🏔️ Toutes" active={zone === 'all'} onPress={() => setZone('all')} small />
            <Chip label="⭐ Favoris" active={zone === 'favorites'} onPress={() => setZone('favorites')} small />
            <Chip
              label="Inclure les stations fermées"
              active={includeClosed}
              onPress={() => setIncludeClosed((v) => !v)}
              small
            />
          </ScrollView>
          {!includeClosed && closed > 0 ? (
            <Text style={styles.note}>
              {closed} station{closed > 1 ? 's' : ''} fermée{closed > 1 ? 's' : ''} ce week-end masquée
              {closed > 1 ? 's' : ''} (ski de randonnée : activez « Inclure les stations fermées »).
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        weekend.dates.length && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {zone === 'favorites' && favorites.length === 0 ? 'Aucune station favorite' : 'Aucune station ouverte ce week-end'}
            </Text>
            {!includeClosed ? (
              <Chip label="Inclure les stations fermées" active onPress={() => setIncludeClosed(true)} />
            ) : null}
          </View>
        ) : undefined
      }
      renderItem={({ item, index }) => <RankCard item={item} rank={index} />}
      ListFooterComponent={
        ranked.length ? (
          <Text style={styles.footer}>
            Note sur 100 environ : neige fraîche attendue d’ici la fin du week-end (jusqu’à 60 pts), enneigement au
            sommet (jusqu’à 50 pts), +12 pts par jour de beau temps, −15 pts par jour de pluie en bas des pistes,
            −1 pt par 15 km depuis Grenoble. Prévisions Open-Meteo au sommet ; ouverture d’après les bulletins des
            stations.
          </Text>
        ) : undefined
      }
    />
  );
}

function RankCard({ item, rank }: { item: Ranked; rank: number }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/station/[id]', params: { id: item.station.id } })}
      style={({ pressed }) => [styles.card, rank === 0 && styles.cardFirst, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.cardTop}>
        <Text style={styles.rank}>{MEDALS[rank] ?? `${rank + 1}.`}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.station.name}</Text>
          <Text style={styles.meta}>
            {item.station.massif} · {Math.round(item.dist)} km
            {item.openOnWeekend === false ? ' · fermée' : item.openOnWeekend === null ? ' · ouverture non communiquée' : ''}
          </Text>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>{Math.max(0, item.score)}</Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
        <StarButton stationId={item.station.id} />
      </View>

      <View style={styles.days}>
        {item.weekendDays.map((d) => (
          <View key={d.date} style={styles.day}>
            <Text style={styles.dayName}>{dayMonth(d.date)}</Text>
            <Text style={styles.dayIcon}>{weatherInfo(d.weatherCode).icon}</Text>
            <Text style={styles.daySnow}>{d.snowfallCm >= 1 ? `${Math.round(d.snowfallCm)} cm` : '–'}</Text>
            <Text style={styles.dayTemp}>
              {d.tMin}° / {d.tMax}°
            </Text>
          </View>
        ))}
        <View style={[styles.day, styles.dayStat]}>
          <Text style={styles.dayName}>Neige fraîche</Text>
          <Text style={styles.statValue}>{item.freshCm} cm</Text>
          <Text style={styles.dayTemp}>
            {item.depthCm !== null ? `${item.depthCm} cm ${item.depthMeasured ? 'mesurés' : 'estimés'}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.reasons}>
        {item.pros.map((p) => (
          <Text key={p} style={[styles.reason, styles.pro]}>
            {p}
          </Text>
        ))}
        {item.cons.map((c) => (
          <Text key={c} style={[styles.reason, styles.con]}>
            {c}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, width: '100%', maxWidth: MAX_READING_WIDTH, alignSelf: 'center' },
  header: { gap: 10, marginBottom: 4 },
  period: { fontSize: 16, fontWeight: '700', color: colors.text },
  note: { fontSize: 12, color: colors.muted },
  chips: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingRight: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  cardFirst: { borderColor: colors.star, borderWidth: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { fontSize: 24, minWidth: 32, textAlign: 'center', color: colors.text, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  score: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  scoreLabel: { fontSize: 10, color: colors.primary },
  days: { flexDirection: 'row', gap: 8 },
  day: { flex: 1, alignItems: 'center', backgroundColor: colors.bg, borderRadius: 10, paddingVertical: 8, gap: 2 },
  dayStat: { justifyContent: 'center' },
  dayName: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  dayIcon: { fontSize: 22 },
  daySnow: { fontSize: 14, fontWeight: '800', color: colors.primary },
  dayTemp: { fontSize: 11, color: colors.muted },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reason: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  pro: { color: colors.high, backgroundColor: colors.okBg },
  con: { color: colors.medium, backgroundColor: colors.warnBg },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  footer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 16 },
});
