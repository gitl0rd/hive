// What a theme is. Each theme is one file in this folder (hive.ts, brain.ts); index.ts lists them.
// Themes are pure data: colours, wording, sprite and icon names. The UI reads them through
// ThemeProvider / useTheme (src/ui/ThemeContext.tsx).

import type { Sprite } from './sprites';

export type ThemeId = 'hive' | 'brain';

export interface ThemePalette {
  /** Background */
  bg: string;
  /** All text, frames, hex rings, sprite */
  screen: string;
  /** Hive-only tasks' project colour */
  hive: string;
  /** Flight trail colour (dots between hops) */
  trail: string;
  /** Sprite wing colour */
  wing: string;
}

/**
 * Every user-facing word that changes with the theme. Anything not here (TODAY, SYNC TODOIST,
 * OPEN/DONE/REMOVE/AGAIN, token setup copy) is the same in every theme.
 */
export interface ThemeWords {
  /** Header + footer brand, e.g. HIVE·OS */
  brand: string;
  /** Comb window title */
  comb: string;
  /** Log window title */
  log: string;
  /** Status on the comb frame */
  phase: { ready: string; flying: string; landed: string };
  /** Big button */
  spin: string;
  spinning: string;
  nothingToSpin: string;
  /** Mobile tab that holds the board */
  spinTab: string;
  /** Board with nothing on it */
  emptyBoard: string;
  emptyHistory: string;
  /** Cells on the board: 'flower' / 'flowers' (screen-reader labels) */
  item: string;
  items: string;
  /** Add-task placeholder while the sprite is out */
  lockedPlaceholder: string;
  /** Screen-reader names */
  a11y: {
    comb: string;
    log: string;
    spin: string;
    inFlight: string;
    nothingToSpin: string;
    /** "The bee landed on X, Project." */
    landedOn: (title: string, project: string) => string;
    resetHint: string;
  };
}

export interface Theme {
  id: ThemeId;
  /** Shown in settings */
  name: string;
  /** One line under the name in settings */
  blurb: string;
  palette: ThemePalette;
  words: ThemeWords;
  sprite: Sprite;
  /** Faint pattern drawn behind everything */
  backdrop: 'none' | 'gyri';
  /**
   * Flight log rewrites. The log is stored in the default (hive) wording and rewritten when shown,
   * so switching theme relabels the whole log. Applied in order to each line.
   */
  logRewrites: readonly (readonly [RegExp, string])[];
  icon: {
    /** Native alternate app icon (app.json plugin entry name); null = the default icon */
    native: string | null;
    /** Web favicon + apple-touch-icon, relative to the site root (public/) */
    favicon: string;
    appleTouch: string;
  };
}
