import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { lateTag } from '../domain/labels';
import { a, colors, fonts, glow, noGlow } from './theme';

export const LANDED_MARK = 'LANDED:';

/**
 * Log lines anchored to the bottom; older lines fade. A line containing 'LANDED:' renders inverse.
 * Optional header (the winner's name, big) at the top.
 */
export function FlightLog({
  lines,
  fontSize = 13,
  showCursor = true,
  header,
}: {
  lines: string[];
  fontSize?: number;
  showCursor?: boolean;
  header?: { title: string; sub: string; titleSize: number; subSize: number };
}) {
  const lineH = Math.round(fontSize * 1.48);
  const [h, setH] = useState(0);
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    setH(e.nativeEvent.layout.height);
    setW(e.nativeEvent.layout.width - 24);
  };
  // Long winner names can take two lines
  const headerH = header
    ? header.titleSize * (header.title.length * 0.4 * header.titleSize > w ? 2 : 1) +
      header.subSize +
      12
    : 0;
  const fit = Math.max(1, Math.floor((h - headerH - (showCursor ? lineH : 0)) / lineH));
  const visible = lines.slice(-fit);

  return (
    <View style={styles.box} onLayout={onLayout}>
      {header ? (
        <View style={styles.header}>
          <Text
            style={[styles.big, { fontSize: header.titleSize }]}
            numberOfLines={2}
            accessibilityLiveRegion="polite"
          >
            {header.title}
          </Text>
          <Text style={[styles.sub, { fontSize: header.subSize }]} numberOfLines={1}>
            {header.sub}
          </Text>
        </View>
      ) : null}
      <View style={styles.lines} accessibilityLabel="Flight log">
        {visible.map((t, k) => {
          const landed = t.includes(LANDED_MARK);
          return (
            <Text
              key={`${lines.length - visible.length + k}`}
              numberOfLines={1}
              style={[
                styles.line,
                { fontSize, lineHeight: lineH },
                landed ? styles.inverse : { opacity: 0.45 + (0.55 * (k + 1)) / visible.length },
              ]}
            >
              {/* keep the log's indentation: plain spaces collapse in Text on web */}
              {t.replace(/ /g, '\u00A0')}
            </Text>
          );
        })}
        {showCursor ? (
          <View style={[styles.cursor, { height: fontSize + 3, width: fontSize * 0.7 }]} />
        ) : null}
      </View>
    </View>
  );
}

/** Big winner name + 'MEGA DOG · 2D LATE' at the top of the flight log. */
export function winnerHeader(
  f: { title: string; projectName: string; daysLate?: number },
  titleSize: number,
  subSize: number,
) {
  const late = lateTag(f.daysLate);
  return {
    title: f.title.toUpperCase(),
    sub: f.projectName.toUpperCase() + (late ? ` · ${late.slice(1)} LATE` : ''),
    titleSize,
    subSize,
  };
}

const styles = StyleSheet.create({
  box: { flex: 1, overflow: 'hidden', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 10 },
  header: { gap: 2, marginBottom: 6 },
  big: { fontFamily: fonts.display, color: colors.screen, lineHeight: undefined, ...glow },
  sub: {
    fontFamily: fonts.display,
    color: colors.screen,
    opacity: 0.7,
    letterSpacing: 1.5,
    ...glow,
  },
  lines: { flex: 1, justifyContent: 'flex-end' },
  line: { fontFamily: fonts.body, color: colors.screen, ...glow },
  inverse: {
    backgroundColor: colors.screen,
    color: colors.bg,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    ...noGlow,
  },
  cursor: { backgroundColor: colors.screen, marginTop: 2, boxShadow: `0 0 6px ${a(0.7)}` },
});
