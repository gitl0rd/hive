import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { hhmm } from '../domain/dates';
import { projectCode } from '../domain/labels';
import type { Landing } from '../domain/types';
import { a, colors, fonts, glow } from './theme';

/** Past landings, newest first. */
export function History({ landings, fontSize = 22 }: { landings: Landing[]; fontSize?: number }) {
  const t = { fontSize, lineHeight: fontSize * 1.1 };
  if (landings.length === 0) {
    return (
      <Text style={[styles.t, styles.empty, { fontSize: fontSize - 2 }]}>
        NO ENTRIES. SPIN TO BEGIN.
      </Text>
    );
  }
  return (
    <ScrollView style={styles.list}>
      {landings.map((l, i) => (
        <View key={`${l.at}-${i}`} style={styles.row}>
          <Text style={[styles.t, t, { opacity: 0.65 }]}>{hhmm(new Date(l.at))}</Text>
          <Text style={[styles.t, t, styles.title]} numberOfLines={1}>
            {l.title.toUpperCase()}
          </Text>
          <Text style={[styles.t, t, { color: l.color, textShadowColor: l.color }]}>
            {projectCode(l.projectName)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  row: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: a(0.3),
  },
  t: { fontFamily: fonts.display, color: colors.screen, ...glow },
  title: { flex: 1, minWidth: 0 },
  empty: { opacity: 0.7, letterSpacing: 1.5 },
});
