import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { DEFAULT_THEME_ID, getThemeTokens, type ThemeId, type ThemeTokens } from '../themes';

const Ctx = createContext<ThemeTokens>(getThemeTokens(DEFAULT_THEME_ID));

/** Makes the theme (src/themes) available to every component below. */
export function ThemeProvider({ id, children }: { id: ThemeId; children: ReactNode }) {
  return <Ctx.Provider value={getThemeTokens(id)}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeTokens {
  return useContext(Ctx);
}

/**
 * Theme-dependent styles. Pass a function defined at module level; it re-runs only when the
 * theme changes.
 */
export function useThemedStyles<T>(make: (t: ThemeTokens) => T): T {
  const t = useTheme();
  return useMemo(() => make(t), [t, make]);
}
