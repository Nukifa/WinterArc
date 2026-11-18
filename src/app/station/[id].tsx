import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { reliability, totalSnowfall, weatherInfo, type AltitudeConditions } from '@/api/openMeteo';
import { useConditions } from '@/data/ConditionsContext';
import { distanceFromGrenoble, getStation } from '@/data/stations';
import { colors, radius } from '@/theme';
import { cm, longDay } from '@/utils/format';

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const station = getStation(String(id));
  const { data, loading, refresh } = useConditions();

  if (!station) {
    return (
      <View style={styles.center}>
        <Text>Station introuvable.</Text>
      </View>
    );
  }
  const c = data[station.id];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
    >
      <Stack.Screen options={{ title: station.name }} />

      <Text style={styles.meta}>
        {station.massif} · {Math.round(distanceFromGrenoble(station))} km de Grenoble · {station.altBase}–
        {station.altTop} m
      </Text>

      {/* Enneigement */}
      <Text style={styles.section}>Enneigement estimé</Text>
      {c ? (
        <View style={styles.row}>
          <DepthCard title="Sommet" cond={c.top} />
          <DepthCard title="Bas des pistes" cond={c.base} />
        </View>
      ) : (
        <Text style={styles.meta}>{loading ? 'Chargement…' : 'Données indisponibles'}</Text>
      )}

      {/* Prévisions */}
      {c ? (
        <>
          <Text style={styles.section}>
            Prévisions de neige · +{totalSnowfall(c.top.days)} cm au sommet sur {c.top.days.length} j
          </Text>
          <View style={styles.card}>
            <View style={[styles.fRow, styles.fHead]}>
              <Text style={[styles.fDay, styles.headText]}>Jour</Text>
              <Text style={[styles.fNum, styles.headText]}>{station.altTop} m</Text>
              <Text style={[styles.fNum, styles.headText]}>{station.altBase} m</Text>
              <Text style={[styles.fNum, styles.headText]}>Iso 0°</Text>
            </View>
            {c.top.days.map((d, i) => {
              const base = c.base.days[i];
              const w = weatherInfo(d.weatherCode);
              const r = reliability(i);
              return (
                <View key={d.date} style={[styles.fRow, i > 0 && styles.fBorder]}>
                  <View style={styles.fDay}>
                    <Text style={styles.dayText}>
                      {w.icon} {longDay(d.date, i)}
                    </Text>
                    <Text style={styles.small}>
                      {d.tMin}° / {d.tMax}° au sommet ·{' '}
                      <Text style={{ color: colors[r.level], fontWeight: '700' }}>{r.label}</Text>
                    </Text>
                  </View>
                  <Text style={[styles.fNum, styles.snowNum, d.snowfallCm < 1 && styles.zero]}>
                    {d.snowfallCm >= 1 ? `${Math.round(d.snowfallCm)} cm` : '–'}
                  </Text>
                  <Text style={[styles.fNum, styles.snowNum, (!base || base.snowfallCm < 1) && styles.zero]}>
                    {base && base.snowfallCm >= 1 ? `${Math.round(base.snowfallCm)} cm` : '–'}
                  </Text>
                  <Text style={[styles.fNum, styles.small]}>
                    {d.freezingLevelM !== null ? `${d.freezingLevelM} m` : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.note}>
            Fiabilité : J0–J1 fiable, J2–J3 assez fiable, J4 simple tendance. Au-delà, les prévisions de neige ne sont
            pas assez précises pour être affichées.
          </Text>
        </>
      ) : null}

      {/* Webcams */}
      <Text style={styles.section}>Webcams</Text>
      {station.webcams.map((w, i) =>
        Platform.OS === 'web' ? (
          <Pressable key={w.url} style={styles.button} onPress={() => Linking.openURL(w.url)}>
            <Text style={styles.buttonText}>📷 {w.label} ↗</Text>
          </Pressable>
        ) : (
          <Link key={w.url} href={{ pathname: '/webcam/[id]', params: { id: station.id, i: String(i) } }} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>📷 {w.label}</Text>
            </Pressable>
          </Link>
        ),
      )}
      <Pressable style={styles.linkButton} onPress={() => Linking.openURL(station.website)}>
        <Text style={styles.linkText}>🌐 Site officiel de la station ↗</Text>
      </Pressable>

      <Text style={styles.note}>
        Hauteurs de neige issues d'un modèle météo (Open-Meteo), recalculées à l'altitude du sommet et du bas : ce ne
        sont pas les relevés officiels de la station.
      </Text>
    </ScrollView>
  );
}

function DepthCard({ title, cond }: { title: string; cond: AltitudeConditions }) {
  return (
    <View style={[styles.card, { flex: 1, padding: 14 }]}>
      <Text style={styles.small}>
        {title} · {cond.altitude} m
      </Text>
      <Text style={styles.bigNum}>{cm(cond.snowDepthCm)}</Text>
      <Text style={styles.small}>Neige fraîche 72 h : {cond.snowfallPast72hCm} cm</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  meta: { color: colors.muted, fontSize: 13 },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 22, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  bigNum: { fontSize: 28, fontWeight: '800', color: colors.text, marginVertical: 4 },
  small: { fontSize: 11, color: colors.muted },
  fRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  fHead: { backgroundColor: colors.primarySoft, paddingVertical: 8 },
  headText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  fBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  fDay: { flex: 1 },
  fNum: { width: 62, textAlign: 'right' },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.text },
  snowNum: { fontSize: 14, fontWeight: '800', color: colors.primary },
  zero: { color: colors.low, fontWeight: '400' },
  note: { fontSize: 11, color: colors.muted, marginTop: 10, lineHeight: 15 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkButton: { paddingVertical: 10 },
  linkText: { color: colors.primary, fontWeight: '600' },
});
