import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '../store/settings';
import { forgetToken, loadToken, saveToken } from '../store/token';
import { syncFailureReason } from '../store/useHive';
import { validateToken } from '../todoist/api';
import { Crt, CrtBackdrop } from './Crt';
import { Screen } from './Screen';
import { colors, layout, sizes } from './theme';
import { type ConnectResult, TokenSetup } from './TokenSetup';

type View_ = 'loading' | 'setup' | 'board';

/**
 * Decides what to show: token setup (first run / replace token) or the board, in Todoist or Demo
 * mode. Owns the token and settings.
 */
export function AppRoot() {
  const { width } = useWindowDimensions();
  const desktop = width >= layout.desktopMinWidth;
  const [view, setView] = useState<View_>('loading');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [token, setToken] = useState<string | null>(null);
  /** Came to setup from settings: offer Cancel back to the board */
  const [canCancel, setCanCancel] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([loadSettings(), loadToken().catch(() => null)]);
      setSettings(s);
      setToken(t);
      setView(s.mode === 'demo' || (s.mode === 'todoist' && t) ? 'board' : 'setup');
    })();
  }, []);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s).catch(() => {});
  };

  const connect = async (t: string): Promise<ConnectResult> => {
    try {
      await validateToken(t);
    } catch (e) {
      return { ok: false, reason: syncFailureReason(e) };
    }
    await saveToken(t);
    setToken(t);
    updateSettings({ ...settings, mode: 'todoist' });
    setCanCancel(false);
    setView('board');
    return { ok: true };
  };

  const demo = () => {
    updateSettings({ ...settings, mode: 'demo' });
    setCanCancel(false);
    setView('board');
  };

  const forget = async () => {
    await forgetToken().catch(() => {});
    setToken(null);
    updateSettings({ ...settings, mode: null });
    setCanCancel(false);
    setView('setup');
  };

  return (
    <View style={styles.root}>
      <CrtBackdrop />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        {view === 'setup' ? (
          <TokenSetup
            onConnect={connect}
            onDemo={settings.mode === 'demo' ? undefined : demo}
            onCancel={canCancel ? () => setView('board') : undefined}
          />
        ) : view === 'board' && settings.mode ? (
          <Screen
            // Remount (fresh state + storage namespace) when switching mode or token
            key={`${settings.mode}:${token ?? ''}`}
            mode={settings.mode}
            token={token}
            settings={settings}
            onSettingsChange={updateSettings}
            onReplaceToken={() => {
              setCanCancel(true);
              setView('setup');
            }}
            onForgetToken={forget}
            onLeaveDemo={() => {
              setCanCancel(true);
              setView('setup');
            }}
          />
        ) : null}
      </SafeAreaView>
      <Crt size={desktop ? sizes.desktop : sizes.mobile} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
});
