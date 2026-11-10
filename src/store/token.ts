// The Todoist token lives only on this device: SecureStore on iOS/Android, localStorage on web.
// Never log it. Only src/todoist/client.ts sends it, and only to the Todoist API.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'hive.token';

function webStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage()?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function saveToken(token: string): Promise<void> {
  const t = token.trim();
  if (Platform.OS === 'web') {
    webStorage()?.setItem(KEY, t);
    return;
  }
  await SecureStore.setItemAsync(KEY, t);
}

export async function forgetToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
