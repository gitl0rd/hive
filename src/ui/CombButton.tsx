import { Pressable, StyleSheet, Text } from 'react-native';

import type { Phase } from './useBoard';
import type { ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

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
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reset = phase !== 'idle';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        reset ? `Reset the ${t.theme.words.a11y.comb.toLowerCase()}` : 'Shuffle the board'
      }
      accessibilityHint={reset ? t.theme.words.a11y.resetHint : "Gives today's board a new layout."}
      onPress={reset ? onReset : onShuffle}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.6 : 0.85 }]}
      testID="comb-button"
    >
      <Text style={[styles.t, { fontSize }]}>{reset ? '[RESET]' : '[SHUFFLE]'}</Text>
    </Pressable>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    btn: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
    t: { fontFamily: fonts.display, color: t.screen, letterSpacing: 2, ...t.glow },
  });
