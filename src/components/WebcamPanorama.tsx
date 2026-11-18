import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { isLive, type Webcam } from '@/api/webcams';
import { colors, radius } from '@/theme';
import { relativeAge } from '@/utils/format';

const HEIGHT = 190;
/** Rapport largeur / hauteur des panoramas Skaping (≈ 6,6). Corrigé au chargement de l'image. */
const DEFAULT_RATIO = 3180 / 480;

/** Panorama 360° d'une webcam, à faire défiler horizontalement. */
export function WebcamPanorama({ cam, stationId }: { cam: Webcam; stationId: string }) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [failed, setFailed] = useState(false);
  const live = isLive(cam);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.label} numberOfLines={1}>
          {cam.label}
        </Text>
        <Text style={[styles.badge, live ? styles.badgeLive : styles.badgeOld]}>
          {live ? '● ' : 'Ancienne image · '}
          {relativeAge(cam.time)}
        </Text>
      </View>

      {failed ? (
        <View style={[styles.placeholder, { height: HEIGHT }]}>
          <Text style={styles.small}>Image indisponible</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ height: HEIGHT }}>
          <Image
            source={{ uri: cam.small }}
            style={{ height: HEIGHT, width: HEIGHT * ratio }}
            resizeMode="cover"
            accessibilityLabel={`Panorama ${cam.label}`}
            onLoad={(e) => {
              const src = e.nativeEvent?.source;
              if (src?.width && src?.height) setRatio(src.width / src.height);
            }}
            onError={() => setFailed(true)}
          />
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable
          style={styles.button}
          onPress={() => router.push({ pathname: '/webcam/[id]', params: { id: stationId, cam: cam.path } })}
        >
          <Text style={styles.buttonText}>🔄 Vue 360° interactive</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(cam.page)} hitSlop={8}>
          <Text style={styles.link}>skaping.com ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 12 },
  label: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  badgeLive: { color: colors.high, backgroundColor: '#E2F5EA' },
  badgeOld: { color: colors.medium, backgroundColor: '#FDF3E1' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  small: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
