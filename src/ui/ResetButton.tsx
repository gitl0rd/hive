import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, glow } from './theme';

/** Back to the idle board: clears the landing (or aborts a flight). Removes/opens nothing. */
export function ResetButton({
  onPress,
  fontSize = 20,
}: {
  onPress: () => void;
  fontSize?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Reset the comb"
      accessibilityHint="Clears the landing and sends the bee home. Nothing is removed."
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.6 : 0.85 }]}
      testID="reset-comb"
    >
      <Text style={[styles.t, { fontSize }]}>[RESET]</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  t: { fontFamily: fonts.display, color: colors.screen, letterSpacing: 2, ...glow },
});
