// Design tokens for the K terminal design (docs/PLAN.md §7).

export const SCREEN_RGB = '255,165,38';

export const colors = {
  bg: '#0B0600',
  screen: '#FFA526',
  /** idle hex rings */
  dimRing: `rgba(${SCREEN_RGB},0.32)`,
  /** secondary text */
  dimText: `rgba(${SCREEN_RGB},0.65)`,
  /** Hive-only tasks use the screen colour */
  hive: '#FFA526',
} as const;

export const fonts = {
  display: 'VT323_400Regular',
  body: 'ShareTechMono_400Regular',
} as const;

export const glow = {
  textShadowColor: `rgba(${SCREEN_RGB},0.55)`,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 6,
} as const;

export const layout = {
  /** < this width = mobile layout, >= = desktop */
  desktopMinWidth: 900,
  /** below this the desktop right column wraps under the comb */
  desktopWrapWidth: 1000,
  bezelRadius: 30,
} as const;

export const crt = {
  scanlinePeriod: 3,
  scanlineOpacity: 0.26,
  vignetteOpacity: 0.55,
} as const;
