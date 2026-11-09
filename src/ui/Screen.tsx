import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, fonts, glow, layout } from './theme';

/** Placeholder shell for M1. M3 swaps in MobileLayout / DesktopLayout by width. */
export function Screen() {
  const { width } = useWindowDimensions();
  const mode = width >= layout.desktopMinWidth ? 'DESKTOP' : 'MOBILE';
  return (
    <View style={styles.root}>
      <Text style={styles.title}>HIVE·OS</Text>
      <Text style={styles.sub}>
        {'>'} BOOT OK · {mode} · {Math.round(width)}PX
      </Text>
      <Text style={styles.sub}>NO FLOWERS. ADD ONE OR SYNC.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 64,
    color: colors.screen,
    ...glow,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.dimText,
    ...glow,
  },
});
