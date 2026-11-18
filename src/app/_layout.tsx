import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ConditionsProvider } from '@/data/ConditionsContext';
import { FavoritesProvider } from '@/data/FavoritesContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <ConditionsProvider>
      <FavoritesProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: '❄️ Névé' }} />
        <Stack.Screen name="station/[id]" options={{ title: '' }} />
        <Stack.Screen name="webcam/[id]" options={{ title: 'Webcam' }} />
      </Stack>
      </FavoritesProvider>
    </ConditionsProvider>
  );
}
