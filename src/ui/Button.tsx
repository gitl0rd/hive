import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { a, colors, fonts, glow, noGlow } from './theme';

/** Boxed terminal button. `filled` = inverse video (primary action). */
export function TermButton({
  label,
  onPress,
  filled = false,
  height = 56,
  fontSize = 24,
  style,
  accessibilityLabel,
  glowBox = false,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  filled?: boolean;
  height?: number;
  fontSize?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** Big SPIN-style glow */
  glowBox?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { height },
        filled ? styles.filled : glowBox ? styles.glowBox : null,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <Text
        style={[styles.label, { fontSize }, filled ? { color: colors.bg, ...noGlow } : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 2,
    borderColor: colors.screen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  filled: { backgroundColor: colors.screen },
  glowBox: {
    backgroundColor: a(0.08),
    boxShadow: `0 0 18px ${a(0.3)}, inset 0 0 14px ${a(0.15)}`,
  },
  pressed: { opacity: 0.7 },
  label: {
    fontFamily: fonts.display,
    color: colors.screen,
    letterSpacing: 2,
    textTransform: 'uppercase',
    ...glow,
  },
});
