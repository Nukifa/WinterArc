import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeMode } from '@/data/ThemeContext';
import { colors } from '@/theme';

const LABEL = { auto: '🌓 Auto', dark: '🌙 Sombre', light: '☀️ Clair' } as const;

/** Bascule du thème : automatique (système) → sombre → clair. */
export function ThemeToggle() {
  const { mode, cycle } = useThemeMode();
  return (
    <Pressable
      onPress={cycle}
      hitSlop={8}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={`Thème : ${LABEL[mode]}. Toucher pour changer`}
    >
      <Text style={styles.text}>{LABEL[mode]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 12,
  },
  text: { fontSize: 12, fontWeight: '600', color: colors.text },
});
