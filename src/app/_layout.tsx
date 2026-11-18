import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ConditionsProvider } from '@/data/ConditionsContext';
import { FavoritesProvider } from '@/data/FavoritesContext';
import { ThemeProvider } from '@/data/ThemeContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ConditionsProvider>
        <FavoritesProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.text, fontWeight: '700' },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Névé' }} />
            <Stack.Screen name="station/[id]" options={{ title: '' }} />
            <Stack.Screen name="webcam/[id]" options={{ title: 'Webcam' }} />
          </Stack>
        </FavoritesProvider>
      </ConditionsProvider>
    </ThemeProvider>
  );
}
