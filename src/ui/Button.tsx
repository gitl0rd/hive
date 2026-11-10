import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import type { ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

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
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
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
        disabled && !filled ? styles.disabled : null,
        style,
      ]}
    >
      <Text
        style={[styles.label, { fontSize }, filled ? { color: t.bg, ...t.noGlow } : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    btn: {
      borderWidth: 2,
      borderColor: t.screen,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    filled: { backgroundColor: t.screen },
    glowBox: {
      backgroundColor: t.a(0.08),
      boxShadow: `0 0 18px ${t.a(0.3)}, inset 0 0 14px ${t.a(0.15)}`,
    },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.45, boxShadow: 'none' },
    label: {
      fontFamily: fonts.display,
      color: t.screen,
      letterSpacing: 2,
      textTransform: 'uppercase',
      ...t.glow,
    },
  });
