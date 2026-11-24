// What each side of the coin stands for (optional). Empty = show the default heads/tails icon.
// Device-only, shared by Todoist and Demo mode. Never touches Todoist.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CoinLabels {
  heads: string;
  tails: string;
}

export const EMPTY_COIN_LABELS: CoinLabels = { heads: '', tails: '' };
export const COIN_LABEL_MAX = 40;
const KEY = 'hive.coin';

const clean = (x: unknown): string => (typeof x === 'string' ? x.slice(0, COIN_LABEL_MAX) : '');

export async function loadCoinLabels(): Promise<CoinLabels> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_COIN_LABELS;
    const s = JSON.parse(raw) as Partial<CoinLabels>;
    return { heads: clean(s.heads), tails: clean(s.tails) };
  } catch {
    return EMPTY_COIN_LABELS;
  }
}

export async function saveCoinLabels(l: CoinLabels): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ heads: clean(l.heads), tails: clean(l.tails) }));
}
