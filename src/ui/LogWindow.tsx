import type { ReactNode } from 'react';
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { themeLogLine, type ThemeTokens } from '../themes';
import { Frame } from './Frame';
import { LANDED_MARK } from './FlightLog';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

/**
 * The flight log's window. Its title tag (FLIGHT.LOG ▾) folds it down to one line showing the
 * newest log entry, and back. The parent decides the open height via `style`.
 */
export function LogWindow({
  collapsed,
  onToggle,
  lastLine,
  tagSize = 20,
  lineSize = 13,
  style,
  children,
}: {
  collapsed: boolean;
  onToggle: () => void;
  /** Newest log line, shown when folded */
  lastLine?: string;
  tagSize?: number;
  lineSize?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const words = t.theme.words;
  const line = lastLine ? themeLogLine(lastLine, t.theme).trim() : '';
  const landed = line.includes(LANDED_MARK) || /FOCUS:/.test(line);

  const title = (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${collapsed ? 'Expand' : 'Collapse'} ${words.a11y.log.toLowerCase()}`}
      accessibilityState={{ expanded: !collapsed }}
      hitSlop={8}
      style={styles.tagBtn}
    >
      <Text style={[styles.tag, { fontSize: tagSize }]}>
        {`${words.log} ${collapsed ? '▸' : '▾'}`}
      </Text>
    </Pressable>
  );

  return (
    <Frame title={title} style={[collapsed ? styles.folded : null, style]}>
      {collapsed ? (
        <Pressable onPress={onToggle} accessible={false} style={styles.foldedBody}>
          <Text
            numberOfLines={1}
            style={[
              styles.line,
              { fontSize: lineSize },
              landed ? { backgroundColor: t.screen, color: t.bg, ...t.noGlow } : null,
            ]}
          >
            {line || ' '}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.open}>{children}</View>
      )}
    </Frame>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    tagBtn: { backgroundColor: t.bg, paddingHorizontal: 8 },
    tag: { fontFamily: fonts.display, letterSpacing: 2, color: t.screen, ...t.glow },
    folded: { paddingTop: 18, paddingBottom: 8, paddingHorizontal: 12 },
    foldedBody: { minHeight: 18, justifyContent: 'center' },
    line: { fontFamily: fonts.body, color: t.dimText, alignSelf: 'flex-start' },
    open: { flex: 1 },
  });
