import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { crt, layout, SCREEN_RGB } from './theme';

/**
 * CRT overlay: scanlines + vignette + rounded bezel with a faint inner glow.
 * Sits above everything and never takes touches.
 */
export function Crt() {
  const p = crt.scanlinePeriod;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="crt-overlay">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="scan" x="0" y="0" width={p} height={p} patternUnits="userSpaceOnUse">
            <Rect x="0" y="0" width={p} height="1" fill="#000" fillOpacity={crt.scanlineOpacity} />
          </Pattern>
          <RadialGradient id="vig" cx="50%" cy="50%" r="72%">
            <Stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={crt.vignetteOpacity} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scan)" />
        <Rect width="100%" height="100%" fill="url(#vig)" />
      </Svg>
      <View style={styles.bezel} />
    </View>
  );
}

const styles = StyleSheet.create({
  bezel: {
    ...StyleSheet.absoluteFill,
    borderRadius: layout.bezelRadius,
    borderWidth: 2,
    borderColor: `rgba(${SCREEN_RGB},0.12)`,
    // inner glow approximation; boxShadow is supported on web and new-arch native
    boxShadow: `inset 0 0 24px rgba(${SCREEN_RGB},0.10)`,
  },
});
