import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { reliability, totalSnowfall, weatherInfo, type AltitudeConditions } from '@/api/openMeteo';
import { STATUS_LABEL, stationResort, upcomingOpening } from '@/api/resorts';
import { formatPostName, latestReports, type LatestReport } from '@/api/snowReports';
import { isLive, stationWebcams } from '@/api/webcams';
import { DataFreshness } from '@/components/DataFreshness';
import { ResortBulletin } from '@/components/ResortBulletin';
import { SnowTimeline } from '@/components/SnowTimeline';
import { StarButton } from '@/components/StarButton';
import { WebcamPanorama } from '@/components/WebcamPanorama';
import { useConditions } from '@/data/ConditionsContext';
import { distanceFromGrenoble, distanceKm, getStation, STATIONS } from '@/data/stations';
import { colors, radius } from '@/theme';
import { cm, dayMonth, longDay, shortDate } from '@/utils/format';
import { MAX_READING_WIDTH } from '@/utils/layout';

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const station = getStation(String(id));
  const { data, reports, webcams, resorts, loading, refresh } = useConditions();
  const [showAllCams, setShowAllCams] = useState(false);

  if (!station) {
    return (
      <View style={styles.center}>
        <Text>Station introuvable.</Text>
      </View>
    );
  }
  const c = data[station.id];
  const measured = latestReports(station, reports);
  const cams = stationWebcams(station, webcams);
  const resort = stationResort(station, resorts);
  const nearby = STATIONS.filter((s) => s.id !== station.id)
    .map((s) => ({ s, d: distanceKm(station, s) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
    >
      <Stack.Screen options={{ title: station.name, headerRight: () => <StarButton stationId={station.id} size={26} /> }} />

      <Text style={styles.meta}>
        {station.massif} ({station.departement}) · {Math.round(distanceFromGrenoble(station))} km de Grenoble · {station.altBase}–
        {station.altTop} m
      </Text>

      {/* Webcams */}
      <Text style={styles.section}>
        Webcams{cams.length ? ` · ${cams.filter(isLive).length} en direct` : ''}
      </Text>
      {cams.slice(0, showAllCams ? cams.length : 2).map((cam) => (
        <WebcamPanorama key={cam.path} cam={cam} stationId={station.id} />
      ))}
      {cams.length > 2 && !showAllCams ? (
        <Pressable style={styles.moreButton} onPress={() => setShowAllCams(true)}>
          <Text style={styles.linkText}>Voir les {cams.length - 2} autres webcams</Text>
        </Pressable>
      ) : null}
      {cams.length === 0 ? (
        <Text style={styles.meta}>
          {webcams ? 'Pas de webcam intégrée pour cette station.' : loading ? 'Chargement des webcams…' : ''}
        </Text>
      ) : null}
      {station.webcams.map((w) => (
        <Pressable key={w.url} style={styles.linkButton} onPress={() => Linking.openURL(w.url)}>
          <Text style={styles.linkText}>📷 Toutes les webcams sur le site de la station ↗</Text>
        </Pressable>
      ))}

      {/* Bulletin de la station */}
      <Text style={styles.section}>Ouverture & domaine skiable</Text>
      {resort ? (
        <ResortBulletin resort={resort} />
      ) : (
        <Text style={styles.meta}>{resorts ? 'Bulletin de la station indisponible.' : loading ? 'Chargement…' : ''}</Text>
      )}

      {/* Relevés mesurés */}
      <Text style={styles.section}>Relevés mesurés · Météo-France</Text>
      {measured.length > 0 ? (
        measured.map((r) => <MeasuredCard key={r.post.id} report={r} />)
      ) : (
        <Text style={styles.meta}>
          {station.nivoIds.length === 0
            ? "Pas de poste de mesure Météo-France dans cette station : seule l'estimation ci-dessous est disponible."
            : reports
              ? 'Aucun relevé ces 10 derniers jours : les mesures reprennent à l\'ouverture de la station (généralement mi-décembre).'
              : loading
                ? 'Chargement…'
                : 'Relevés indisponibles.'}
        </Text>
      )}

      {/* Enneigement estimé */}
      <Text style={styles.section}>Enneigement estimé · modèle météo</Text>
      {c ? (
        <View style={styles.row}>
          <DepthCard title="Sommet" cond={c.top} />
          <DepthCard title="Bas des pistes" cond={c.base} />
        </View>
      ) : (
        <Text style={styles.meta}>{loading ? 'Chargement…' : 'Données indisponibles'}</Text>
      )}

      {/* Chutes de neige récentes et à venir */}
      {c ? (
        <>
          <Text style={styles.section}>Chutes de neige au sommet · passé et prévisions</Text>
          <View style={[styles.card, { padding: 12 }]}>
            <SnowTimeline cond={c.top} />
          </View>
        </>
      ) : null}

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

      {/* Stations les plus proches */}
      <Text style={styles.section}>Stations les plus proches</Text>
      <View style={styles.card}>
        {nearby.map(({ s, d }, i) => {
          const nc = data[s.id];
          const nr = stationResort(s, resorts);
          const opening = nr ? upcomingOpening(nr) : null;
          return (
            <Pressable
              key={s.id}
              onPress={() => router.push({ pathname: '/station/[id]', params: { id: s.id } })}
              style={({ pressed }) => [styles.nearRow, i > 0 && styles.fBorder, pressed && { opacity: 0.7 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dayText}>{s.name}</Text>
                <Text style={styles.small}>
                  {Math.round(d)} km ·{' '}
                  {nr ? (nr.status === 'open' ? 'Ouverte' : opening ? `ouverture ${dayMonth(opening)}` : STATUS_LABEL[nr.status]) : s.massif}
                </Text>
              </View>
              {nc ? <Text style={styles.snowNum}>+{totalSnowfall(nc.top.days)} cm</Text> : null}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.linkButton} onPress={() => Linking.openURL(station.website)}>
        <Text style={styles.linkText}>🌐 Site officiel de la station ↗</Text>
      </Pressable>

      <View style={{ marginTop: 20 }}>
        <DataFreshness />
      </View>
      <Text style={styles.note}>
        Relevés mesurés : réseau nivo-météorologique Météo-France (data.gouv.fr, licence Etalab 2.0), mis à jour une
        fois par jour. Estimations et prévisions : Open-Meteo (modèles Météo-France AROME / ARPEGE), recalculées à
        l’altitude du sommet et du bas.
      </Text>
    </ScrollView>
  );
}

function MeasuredCard({ report }: { report: LatestReport }) {
  const { post, obs, isRecent } = report;
  const history = post.obs.filter((o) => o.snowDepthCm !== null).slice(-7);
  return (
    <View style={[styles.card, { padding: 14, marginBottom: 8 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.small}>
            {formatPostName(post.name)} · {post.altitude} m
          </Text>
          <Text style={styles.bigNum}>{cm(obs.snowDepthCm)}</Text>
        </View>
        <Text style={[styles.badge, isRecent ? styles.badgeOk : styles.badgeOld]}>
          {isRecent ? 'Mesuré' : 'Ancien'} · {shortDate(obs.time)}
        </Text>
      </View>
      <Text style={styles.small}>
        Neige fraîche 24 h : {cm(obs.freshSnowCm)}
        {obs.tempC !== null ? ` · ${obs.tempC.toFixed(1).replace('.', ',')} °C au relevé` : ''}
      </Text>
      {history.length > 1 ? (
        <Text style={[styles.small, { marginTop: 4 }]}>
          Derniers relevés : {history.map((o) => `${shortDate(o.time)} ${o.snowDepthCm} cm`).join(' · ')}
        </Text>
      ) : null}
    </View>
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
  content: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: MAX_READING_WIDTH, alignSelf: 'center' },
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
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  badgeOk: { color: colors.high, backgroundColor: colors.okBg },
  badgeOld: { color: colors.medium, backgroundColor: colors.warnBg },
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
  buttonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
  linkButton: { paddingVertical: 8 },
  nearRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  chevron: { fontSize: 20, color: colors.low },
  moreButton: { paddingVertical: 4, marginBottom: 4 },
  linkText: { color: colors.primary, fontWeight: '600' },
});
