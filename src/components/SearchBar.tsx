import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

/** Champ de recherche avec bouton d'effacement. */
export function SearchBar({ value, onChange, onSubmit, placeholder }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder ?? 'Rechercher une station, un massif…'}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel="Rechercher une station"
        inputMode="search"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={10} accessibilityLabel="Effacer la recherche">
          <Text style={styles.clear}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  icon: { fontSize: 15 },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16, // ≥ 16 px : évite le zoom automatique de Safari iOS
    color: colors.text,
  },
  clear: { fontSize: 15, color: colors.muted, paddingHorizontal: 4 },
});
