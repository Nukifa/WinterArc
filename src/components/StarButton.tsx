import { Pressable, StyleSheet, Text, type GestureResponderEvent } from 'react-native';

import { useFavorites } from '@/data/FavoritesContext';
import { colors } from '@/theme';

/** Étoile pour ajouter / retirer une station des favoris. */
export function StarButton({ stationId, size = 22 }: { stationId: string; size?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(stationId);
  const onPress = (e: GestureResponderEvent) => {
    // Évite d'ouvrir la fiche quand l'étoile est dans une carte cliquable (web)
    e.stopPropagation?.();
    e.preventDefault?.();
    toggleFavorite(stationId);
  };
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Text style={{ fontSize: size, color: active ? colors.star : colors.low, lineHeight: size + 4 }}>
        {active ? '★' : '☆'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 2 },
});
