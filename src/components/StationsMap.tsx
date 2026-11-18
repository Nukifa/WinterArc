import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

import type { MapStation } from './StationsMap.types';

export type { MapStation } from './StationsMap.types';

/** Version mobile native : la carte interactive n'est disponible que sur le web. */
export function StationsMap(_props: { stations: MapStation[] }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>La carte est disponible dans la version web de Névé.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: colors.muted, textAlign: 'center' },
});
