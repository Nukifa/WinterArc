import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmbeddedPage } from '@/components/EmbeddedPage';
import { useConditions } from '@/data/ConditionsContext';
import { getStation } from '@/data/stations';
import { colors } from '@/theme';

/**
 * Webcam intégrée dans l'app :
 * - `cam` : chemin Skaping -> lecteur 360° interactif de Skaping ;
 * - sinon `i` : page webcams officielle de la station.
 */
export default function WebcamScreen() {
  const { id, cam, i } = useLocalSearchParams<{ id: string; cam?: string; i?: string }>();
  const station = getStation(String(id));
  const { webcams } = useConditions();
  const [failed, setFailed] = useState(false);

  const skaping = cam ? webcams?.webcams[String(cam)] : undefined;
  const official = station?.webcams[Number(i ?? 0)] ?? station?.webcams[0];
  const url = cam ? (skaping?.page ?? `https://www.skaping.com/${cam}`) : official?.url;
  const title = skaping?.label ?? station?.name ?? 'Webcam';

  if (!station || !url) {
    return (
      <View style={styles.center}>
        <Text>Webcam introuvable.</Text>
      </View>
    );
  }

  const openExternal = () => Linking.openURL(url);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable onPress={openExternal} hitSlop={10} style={{ paddingHorizontal: 12 }}>
              <Text style={styles.headerLink}>Ouvrir ↗</Text>
            </Pressable>
          ),
        }}
      />
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.msg}>Impossible d’afficher la webcam dans l’app.</Text>
          <Pressable style={styles.button} onPress={openExternal}>
            <Text style={styles.buttonText}>Ouvrir dans le navigateur</Text>
          </Pressable>
        </View>
      ) : (
        <EmbeddedPage url={url} onError={() => setFailed(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  msg: { color: colors.text, textAlign: 'center' },
  headerLink: { color: colors.primary, fontWeight: '600' },
  button: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
