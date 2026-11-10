// Native (Android / iOS): switch the launcher icon to the theme's alternate icon.
// Needs a build that includes expo-alternate-app-icons (app.json plugin). Never throws: an older
// build without the module, or a launcher that refuses, just keeps the current icon.

import { getTheme, type ThemeId } from '../themes';

export function applyAppIcon(id: ThemeId): void {
  const want = getTheme(id).icon.native;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const icons = require('expo-alternate-app-icons') as typeof import('expo-alternate-app-icons');
    if (!icons.supportsAlternateIcons) return;
    if ((icons.getAppIconName() ?? null) === want) return;
    icons.setAlternateAppIcon(want).catch(() => {});
  } catch {
    // module not in this build
  }
}
