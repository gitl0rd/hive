import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pad2 } from '../domain/labels';
import type { Flower } from '../domain/types';
import { PixelCog } from './PixelCog';
import { itemColor, type ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

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
  /** Small settings cog next to the label */
  onSettings?: () => void;
}) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.t, { fontSize }]} numberOfLines={1}>
          {label}
        </Text>
        {onSettings ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={onSettings}
            hitSlop={12}
            style={styles.cfg}
          >
            <View style={styles.cogGlow}>
              <PixelCog size={Math.round(fontSize * 1.05)} />
            </View>
          </Pressable>
        ) : null}
      </View>
      <View
        style={[styles.meter, { gap: block.gap }]}
        accessible
        accessibilityLabel={`${included.size} of ${flowers.length} ${t.theme.words.items} in today's spin`}
      >
        {flowers.map((f) => {
          const color = itemColor(f.color, f.source === 'hive', t);
          return (
            <View
              key={f.id}
              style={{
                width: block.w,
                height: block.h,
                borderWidth: block.border,
                borderColor: color,
                backgroundColor: included.has(f.id) ? color : 'transparent',
              }}
            />
          );
        })}
      </View>
      <Text style={[styles.t, styles.fixed, { fontSize }]} numberOfLines={1}>
        DONE {pad2(done)}
      </Text>
    </View>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderTopWidth: 2,
      borderTopColor: t.screen,
      paddingTop: 6,
    },
    t: { fontFamily: fonts.display, color: t.screen, letterSpacing: 1.2, ...t.glow },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
    fixed: { flexShrink: 0 },
    cfg: { minHeight: 32, minWidth: 32, alignItems: 'center', justifyContent: 'center' },
    cogGlow: { opacity: 1, filter: `drop-shadow(0 0 4px ${t.a(0.6)})` },
    meter: { flexDirection: 'row', flexShrink: 1, minWidth: 0, overflow: 'hidden' },
  });
