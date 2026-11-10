// Colours derived from a theme's palette: opacities, glows, blends. Pure.

import type { Theme } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `top` at `alpha` over `base`, as an opaque hex. */
export function blend(base: string, top: string, alpha: number): string {
  const b = hexToRgb(base);
  const t = hexToRgb(top);
  return (
    '#' +
    b
      .map((v, i) =>
        Math.round(v + (t[i] - v) * alpha)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  );
}

export interface ThemeTokens {
  theme: Theme;
  bg: string;
  screen: string;
  /** Screen colour at an opacity: a(0.32) etc. */
  a: (opacity: number) => string;
  /** Background colour at an opacity (modal scrim) */
  bgA: (opacity: number) => string;
  /** Trail colour at an opacity */
  trailA: (opacity: number) => string;
  /** idle hex rings */
  dimRing: string;
  /** secondary text */
  dimText: string;
  /** window frames */
  frame: string;
  /** Hive-only tasks */
  hive: string;
  wing: string;
  /** Cell under the sprite: screen @ ~14% over bg */
  beeCell: string;
  glow: {
    textShadowColor: string;
    textShadowOffset: { width: number; height: number };
    textShadowRadius: number;
  };
  noGlow: { textShadowColor: string; textShadowRadius: number };
}

const rgba = (hex: string) => {
  const rgb = hexToRgb(hex).join(',');
  return (o: number) => `rgba(${rgb},${o})`;
};

export function themeTokens(theme: Theme): ThemeTokens {
  const p = theme.palette;
  const a = rgba(p.screen);
  return {
    theme,
    bg: p.bg,
    screen: p.screen,
    a,
    bgA: rgba(p.bg),
    trailA: rgba(p.trail),
    dimRing: a(0.32),
    dimText: a(0.65),
    frame: a(0.7),
    hive: p.hive,
    wing: p.wing,
    beeCell: blend(p.bg, p.screen, 0.14),
    glow: {
      textShadowColor: a(0.55),
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6,
    },
    noGlow: { textShadowColor: 'transparent', textShadowRadius: 0 },
  };
}

/**
 * A task's project colour in this theme. Hive-only tasks are stored with the default hive colour
 * and take the theme's hive colour when shown; Todoist colours never change.
 */
export function itemColor(stored: string, isHiveTask: boolean, t: Pick<ThemeTokens, 'hive'>) {
  return isHiveTask ? t.hive : stored;
}
