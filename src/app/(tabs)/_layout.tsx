import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { ThemeToggle } from '@/components/ThemeToggle';
import { colors } from '@/theme';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerRight: () => <ThemeToggle />,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '❄️ Névé', tabBarLabel: 'Stations', tabBarIcon: icon('🏔️') }} />
      <Tabs.Screen
        name="weekend"
        options={{ title: 'Où skier ce week-end ?', tabBarLabel: 'Week-end', tabBarIcon: icon('🏆') }}
      />
      <Tabs.Screen name="carte" options={{ title: 'Carte des stations', tabBarLabel: 'Carte', tabBarIcon: icon('🗺️') }} />
    </Tabs>
  );
}
