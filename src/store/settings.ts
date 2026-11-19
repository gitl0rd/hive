// Small app settings (not secret). AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from '../themes';

export type Mode = 'todoist' | 'demo';

export interface Settings {
  /** null = first run, show token setup */
  mode: Mode | null;
  haptics: boolean;
  /** Land instantly instead of flying. The OS "reduce motion" setting also turns this on. */
  reducedMotion: boolean;
  /** Look and wording (src/themes) */
  theme: ThemeId;
  /** Flight log window folded down to its title bar */
  logCollapsed: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: null,
  haptics: true,
  reducedMotion: false,
  theme: DEFAULT_THEME_ID,
  logCollapsed: false,
};
const KEY = 'hive.settings';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      mode: s.mode === 'todoist' || s.mode === 'demo' ? s.mode : null,
      haptics: typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics,
      reducedMotion:
        typeof s.reducedMotion === 'boolean' ? s.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      theme: isThemeId(s.theme) ? s.theme : DEFAULT_SETTINGS.theme,
      logCollapsed:
        typeof s.logCollapsed === 'boolean' ? s.logCollapsed : DEFAULT_SETTINGS.logCollapsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}
