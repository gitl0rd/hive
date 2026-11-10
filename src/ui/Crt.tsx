import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { a, crt, type SizeSet } from './theme';

/** Faint phosphor glow behind everything (render first). */
export function CrtBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="phosphor" cx="45%" cy="42%" r="70%">
            <Stop offset="0" stopColor="#FFA526" stopOpacity={0.09} />
            <Stop offset="1" stopColor="#FFA526" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#phosphor)" />
      </Svg>
    </View>
  );
}

/**
 * CRT overlay: scanlines + vignette + rounded bezel with a faint inner glow.
 * Sits above everything and never takes touches.
 */
export function Crt({ size }: { size: SizeSet }) {
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

const styles = StyleSheet.create({
  bezel: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: a(0.22),
    boxShadow: `inset 0 0 50px ${a(0.1)}`,
  },
});
