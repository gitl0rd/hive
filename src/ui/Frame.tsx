import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useThemedStyles } from './ThemeContext';

/** A terminal window: thin frame with title tags sitting on the top edge. */
export function Frame({
  title,
  right,
  bottomRight,
  tagSize = 20,
  style,
  children,
  accessibilityLabel,
}: {
  title?: ReactNode;
  right?: ReactNode;
  /** Control sitting on the bottom edge, right side (e.g. [RESET]) */
  bottomRight?: ReactNode;
  tagSize?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  accessibilityLabel?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const tagTop = -Math.round(tagSize * 0.6);
  return (
    <View style={[styles.frame, style]} accessibilityLabel={accessibilityLabel}>
      {children}
      {title ? (
        typeof title === 'string' ? (
          <Text style={[styles.tag, { top: tagTop, left: 12, fontSize: tagSize }]}>{title}</Text>
        ) : (
          <View style={[styles.tagSlot, { top: tagTop - 4, left: 12 }]}>{title}</View>
        )
      ) : null}
      {right ? (
        <Text style={[styles.tag, { top: tagTop, right: 12, fontSize: tagSize }]}>{right}</Text>
      ) : null}
      {bottomRight ? (
        <View style={[styles.edgeSlot, { bottom: tagTop - 4, right: 12 }]}>{bottomRight}</View>
      ) : null}
    </View>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    frame: {
      position: 'relative',
      borderWidth: 1.5,
      borderColor: t.frame,
    },
    tag: {
      position: 'absolute',
      paddingHorizontal: 8,
      backgroundColor: t.bg,
      color: t.screen,
      fontFamily: fonts.display,
      letterSpacing: 2,
      lineHeight: undefined,
      ...t.glow,
    },
    edgeSlot: {
      position: 'absolute',
      backgroundColor: t.bg,
      paddingHorizontal: 4,
    },
    tagSlot: {
      position: 'absolute',
      flexDirection: 'row',
      gap: 6,
    },
  });
