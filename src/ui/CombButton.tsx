import { Pressable, StyleSheet, Text } from 'react-native';

import type { Phase } from './useBoard';
import { colors, fonts, glow } from './theme';

/**
 * One corner control on the comb, named for what it does right now:
 * - idle board: [SHUFFLE] — new layout for today
 * - landed / in flight: [RESET] — back to the idle board (clears the landing, aborts a flight);
 *   nothing is removed, opened or marked done.
 */
export function CombButton({
  phase,
  onShuffle,
  onReset,
  fontSize = 20,
}: {
  phase: Phase;
  onShuffle: () => void;
  onReset: () => void;
  fontSize?: number;
}) {
  const reset = phase !== 'idle';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={reset ? 'Reset the comb' : 'Shuffle the board'}
      accessibilityHint={
        reset
          ? 'Clears the landing and sends the bee home. Nothing is removed.'
          : "Gives today's board a new layout."
      }
      onPress={reset ? onReset : onShuffle}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.6 : 0.85 }]}
      testID="comb-button"
    >
      <Text style={[styles.t, { fontSize }]}>{reset ? '[RESET]' : '[SHUFFLE]'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  t: { fontFamily: fonts.display, color: colors.screen, letterSpacing: 2, ...glow },
});
