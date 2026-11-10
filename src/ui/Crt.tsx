import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { ThemeTokens } from '../themes';
import { crt, type SizeSet } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

/** Brain folds (gyri) tile, 140×120 at scale 1. From the BRAIN HIVE design. */
const GYRI =
  'M0 18 C 18 4, 30 34, 48 18 S 80 2, 96 20 S 124 34, 140 18 M0 62 C 14 48, 34 50, 40 66 S 62 84, 76 64 S 104 46, 116 62 S 132 76, 140 62 M0 104 C 20 92, 28 118, 50 106 S 84 88, 100 104 S 126 116, 140 104 M24 30 C 16 40, 30 46, 22 54 M70 22 C 78 32, 64 40, 72 50 M112 74 C 104 84, 118 90, 110 98 M58 84 C 50 92, 64 98, 56 108';

/** Faint phosphor glow behind everything (render first), plus the theme's backdrop pattern. */
export function CrtBackdrop({ desktop = false }: { desktop?: boolean }) {
  const t = useTheme();
  const k = desktop ? 1.2 : 1;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="phosphor" cx="45%" cy="42%" r="70%">
            <Stop offset="0" stopColor={t.screen} stopOpacity={0.09} />
            <Stop offset="1" stopColor={t.screen} stopOpacity={0} />
          </RadialGradient>
          {t.theme.backdrop === 'gyri' ? (
            <Pattern
              id="gyri"
              x="0"
              y="0"
              width={140 * k}
              height={120 * k}
              patternUnits="userSpaceOnUse"
            >
              <G transform={`scale(${k})`}>
                <Path
                  d={GYRI}
                  fill="none"
                  stroke={t.screen}
                  strokeOpacity={0.07}
                  strokeWidth={desktop ? 3 : 2.5}
                  strokeLinecap="round"
                />
              </G>
            </Pattern>
          ) : null}
        </Defs>
        <Rect width="100%" height="100%" fill="url(#phosphor)" />
        {t.theme.backdrop === 'gyri' ? (
          <Rect width="100%" height="100%" fill="url(#gyri)" testID="backdrop-gyri" />
        ) : null}
      </Svg>
    </View>
  );
}

/**
 * CRT overlay: scanlines + vignette + rounded bezel with a faint inner glow.
 * Sits above everything and never takes touches.
 */
export function Crt({ size }: { size: SizeSet }) {
  const styles = useThemedStyles(makeStyles);
  const p = crt.scanlinePeriod;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="crt-overlay">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="scan" x="0" y="0" width={p} height={p} patternUnits="userSpaceOnUse">
            <Rect x="0" y="0" width={p} height="1" fill="#000" fillOpacity={crt.scanlineOpacity} />
          </Pattern>
          <RadialGradient id="vig" cx="50%" cy="50%" r="72%">
            <Stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={size.vignette} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scan)" />
        <Rect width="100%" height="100%" fill="url(#vig)" />
      </Svg>
      <View style={[styles.bezel, { margin: size.bezelInset, borderRadius: size.bezelRadius }]} />
    </View>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    bezel: {
      ...StyleSheet.absoluteFill,
      borderWidth: 1,
      borderColor: t.a(0.22),
      boxShadow: `inset 0 0 50px ${t.a(0.1)}`,
    },
  });
