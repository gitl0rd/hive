// The theme directory. Add a theme: write <name>.ts next to hive.ts, add it to THEMES and ThemeId.

import { brain } from './brain';
import { hive } from './hive';
import { type ThemeTokens, themeTokens } from './tokens';
import type { Theme, ThemeId } from './types';

export type { Backdrop, Theme, ThemeId, ThemePalette, ThemeWords } from './types';
export type { ThemeTokens } from './tokens';
export { itemColor } from './tokens';
export { themeLogLine } from './log';

export const THEMES: readonly Theme[] = [hive, brain];
export const DEFAULT_THEME_ID: ThemeId = 'hive';

export function isThemeId(x: unknown): x is ThemeId {
  return THEMES.some((t) => t.id === x);
}

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? hive;
}

const cache = new Map<ThemeId, ThemeTokens>();
/** Tokens for a theme; the same object every time, so it's safe as a memo dependency. */
export function getThemeTokens(id: ThemeId): ThemeTokens {
  let t = cache.get(id);
  if (!t) {
    t = themeTokens(getTheme(id));
    cache.set(id, t);
  }
  return t;
}
