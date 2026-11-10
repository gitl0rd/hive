import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pad2 } from '../domain/labels';
import type { Flower } from '../domain/types';
import { colors, fonts, glow } from './theme';

/** `HIVE·OS | meter | DONE NN`. One meter block per flower, filled if included, in its colour. */
export function Footer({
  label,
  flowers,
  included,
  done,
  fontSize = 18,
  block = { w: 8, h: 14, gap: 3, border: 1.5 },
  onSettings,
}: {
  label: string;
  flowers: Flower[];
  included: ReadonlySet<string>;
  done: number;
  fontSize?: number;
  block?: { w: number; h: number; gap: number; border: number };
  /** Small CFG entry next to the label */
  onSettings?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.t, { fontSize }]}>{label}</Text>
        {onSettings ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={onSettings}
            hitSlop={12}
            style={styles.cfg}
          >
            <Text style={[styles.t, { fontSize, opacity: 0.7 }]}>CFG</Text>
          </Pressable>
        ) : null}
      </View>
      <View
        style={[styles.meter, { gap: block.gap }]}
        accessible
        accessibilityLabel={`${included.size} of ${flowers.length} flowers in today's spin`}
      >
        {flowers.map((f) => (
          <View
            key={f.id}
            style={{
              width: block.w,
              height: block.h,
              borderWidth: block.border,
              borderColor: f.color,
              backgroundColor: included.has(f.id) ? f.color : 'transparent',
            }}
          />
        ))}
      </View>
      <Text style={[styles.t, { fontSize }]}>DONE {pad2(done)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 2,
    borderTopColor: colors.screen,
    paddingTop: 6,
  },
  t: { fontFamily: fonts.display, color: colors.screen, letterSpacing: 1.2, ...glow },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cfg: { minHeight: 32, justifyContent: 'center' },
  meter: { flexDirection: 'row', flexShrink: 1, overflow: 'hidden' },
});
