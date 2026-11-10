import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hhmm } from '../domain/dates';
import { projectCode } from '../domain/labels';
import type { Landing } from '../domain/types';
import { itemColor, type ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

/** Past landings, newest first. Each row can be deleted (only from Hive's history). */
export function History({
  landings,
  fontSize = 22,
  onDelete,
}: {
  landings: Landing[];
  fontSize?: number;
  onDelete?: (landing: Landing) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const t = { fontSize, lineHeight: fontSize * 1.1 };
  if (landings.length === 0) {
    return (
      <Text style={[styles.t, styles.empty, { fontSize: fontSize - 2 }]}>
        {theme.theme.words.emptyHistory}
      </Text>
    );
  }
  return (
    <ScrollView style={styles.list}>
      {landings.map((l, i) => {
        const color = itemColor(l.color, l.flowerId.startsWith('hive:'), theme);
        return (
          <View key={`${l.at}-${i}`} style={styles.row}>
            <Text style={[styles.t, t, { opacity: 0.65 }]}>{hhmm(new Date(l.at))}</Text>
            <Text style={[styles.t, t, styles.title]}>{l.title.toUpperCase()}</Text>
            <Text style={[styles.t, t, { color, textShadowColor: color }]}>
              {projectCode(l.projectName)}
            </Text>
            {onDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${l.title} at ${hhmm(new Date(l.at))} from history`}
                onPress={() => onDelete(l)}
                style={styles.del}
                testID={`hist-del-${i}`}
              >
                <Text style={[styles.t, { fontSize: fontSize - 4, opacity: 0.7 }]}>DEL</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    list: { flex: 1 },
    row: {
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderStyle: 'dotted',
      borderBottomColor: t.a(0.3),
    },
    t: { fontFamily: fonts.display, color: t.screen, ...t.glow },
    title: { flex: 1, minWidth: 0 },
    del: { width: 52, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
    empty: { opacity: 0.7, letterSpacing: 1.5 },
  });
