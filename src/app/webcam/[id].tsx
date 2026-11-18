import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { getStation } from '@/data/stations';
import { colors } from '@/theme';

/**
 * Affiche la page webcams officielle de la station directement dans l'app.
 * Si la page ne se charge pas, on propose de l'ouvrir dans le navigateur.
 */
export default function WebcamScreen() {
  const { id, i } = useLocalSearchParams<{ id: string; i?: string }>();
  const station = getStation(String(id));
  const webcam = station?.webcams[Number(i ?? 0)] ?? station?.webcams[0];
  const [failed, setFailed] = useState(false);

  if (!station || !webcam) {
    return (
      <View style={styles.center}>
        <Text>Webcam introuvable.</Text>
      </View>
    );
  }

  const openExternal = () => Linking.openURL(webcam.url);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: station.name,
          headerRight: () => (
            <Pressable onPress={openExternal} hitSlop={10}>
              <Text style={styles.headerLink}>Navigateur ↗</Text>
            </Pressable>
          ),
        }}
      />
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.msg}>Impossible d’afficher la page webcam dans l’app.</Text>
          <Pressable style={styles.button} onPress={openExternal}>
            <Text style={styles.buttonText}>Ouvrir dans le navigateur</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          source={{ uri: webcam.url }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onError={() => setFailed(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) setFailed(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  msg: { color: colors.text, textAlign: 'center' },
  headerLink: { color: colors.primary, fontWeight: '600' },
  button: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
