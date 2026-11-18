import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';

export function Chip({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, small && styles.small, active && styles.active]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.text, small && styles.textSmall, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  small: { paddingHorizontal: 10, paddingVertical: 5 },
  textSmall: { fontSize: 12 },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.text, fontSize: 13, fontWeight: '600' },
  textActive: { color: '#fff' },
});
