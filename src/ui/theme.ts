// Design tokens for the K terminal design (docs/PLAN.md §7).

export const SCREEN_RGB = '255,165,38';

/** Screen colour at an opacity: a(0.32) etc. */
export const a = (opacity: number) => `rgba(${SCREEN_RGB},${opacity})`;

export const colors = {
  bg: '#0B0600',
  screen: '#FFA526',
  /** idle hex rings */
  dimRing: a(0.32),
  /** secondary text */
  dimText: a(0.65),
  /** window frames */
  frame: a(0.7),
  /** Hive-only tasks use the screen colour */
  hive: '#FFA526',
} as const;

export const fonts = {
  display: 'VT323_400Regular',
  body: 'ShareTechMono_400Regular',
} as const;

/** VT323 is monospaced: every glyph advances 0.4em. Used to wrap SVG labels. */
export const DISPLAY_CHAR_WIDTH_EM = 0.4;

export const glow = {
  textShadowColor: a(0.55),
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 6,
} as const;

export const noGlow = {
  textShadowColor: 'transparent',
  textShadowRadius: 0,
} as const;

export const layout = {
  /** < this width = mobile layout, >= = desktop */
  desktopMinWidth: 900,
  /** below this the desktop right column wraps under the comb */
  desktopWrapWidth: 1000,
} as const;

/** Per-layout sizes from the K mobile (390×844) and K desktop (1440×900) designs. */
export const sizes = {
  mobile: {
    cellWidth: 112,
    boardPad: 18,
    label: 21,
    late: 16,
    labelPadX: 14,
    edge: 3,
    beePx: 3,
    bezelInset: 6,
    bezelRadius: 34,
    vignette: 0.6,
  },
  desktop: {
    cellWidth: 150,
    boardPad: 24,
    label: 26,
    late: 19,
    labelPadX: 18,
    edge: 3.5,
    beePx: 4,
    bezelInset: 10,
    bezelRadius: 28,
    vignette: 0.55,
  },
} as const;

export type SizeSet = (typeof sizes)['mobile'] | (typeof sizes)['desktop'];

export const crt = {
  scanlinePeriod: 3,
  scanlineOpacity: 0.26,
} as const;
