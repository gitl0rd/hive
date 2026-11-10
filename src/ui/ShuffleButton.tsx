import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, glow } from './theme';

/** Small text control: new board layout (new seed) for today. */
export function ShuffleButton({
  onPress,
  disabled = false,
  fontSize = 20,
}: {
  onPress: () => void;
  disabled?: boolean;
  fontSize?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Shuffle the board"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, { opacity: disabled ? 0.3 : pressed ? 0.6 : 0.8 }]}
    >
      <Text style={[styles.t, { fontSize }]}>[SHUFFLE]</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  t: { fontFamily: fonts.display, color: colors.screen, letterSpacing: 2, ...glow },
});
