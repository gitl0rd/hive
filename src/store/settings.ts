// Small app settings (not secret). AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mode = 'todoist' | 'demo';

export interface Settings {
  /** null = first run, show token setup */
  mode: Mode | null;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = { mode: null, haptics: true };
const KEY = 'hive.settings';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      mode: s.mode === 'todoist' || s.mode === 'demo' ? s.mode : null,
      haptics: typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}
