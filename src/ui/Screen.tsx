import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';

import { sampleHiveTitles, sampleTodoistSource } from '../demo/sampleData';
import type { Settings } from '../store/settings';
import type { TodoistSource } from '../store/useHive';
import { fetchTodoistBoard } from '../todoist/api';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { SettingsPanel } from './SettingsPanel';
import { layout } from './theme';
import { useBoard } from './useBoard';

export interface ScreenProps {
  /** 'demo' uses sample data in its own storage; 'todoist' reads the API with `token` */
  mode: 'todoist' | 'demo';
  token: string | null;
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
  onReplaceToken: () => void;
  onForgetToken: () => void;
  onLeaveDemo: () => void;
}

/** The board: picks the mobile or desktop layout by width. */
export function Screen(props: ScreenProps) {
  const { mode, token, settings } = props;
  const { width } = useWindowDimensions();
  const desktop = width >= layout.desktopMinWidth;
  const [cfgOpen, setCfgOpen] = useState(false);
  const osReduceMotion = useOsReduceMotion();

  const source: TodoistSource = useMemo(
    () =>
      mode === 'demo' || !token ? sampleTodoistSource : () => fetchTodoistBoard(token, new Date()),
    [mode, token],
  );
  const board = useBoard({
    source,
    haptics: settings.haptics,
    reducedMotion: settings.reducedMotion || osReduceMotion,
    ...(mode === 'demo' ? { ns: 'hive.demo', seedTaskTitles: sampleHiveTitles } : { ns: 'hive' }),
  });
  const chrome = { demo: mode === 'demo', onSettings: () => setCfgOpen(true) };

  return (
    <View style={styles.fill}>
      {desktop ? (
        <DesktopLayout board={board} chrome={chrome} />
      ) : (
        <MobileLayout board={board} chrome={chrome} />
      )}
      {cfgOpen ? (
        <SettingsPanel
          mode={mode}
          haptics={settings.haptics}
          onHaptics={(on) => props.onSettingsChange({ ...settings, haptics: on })}
          reducedMotion={settings.reducedMotion}
          osReduceMotion={osReduceMotion}
          onReducedMotion={(on) => props.onSettingsChange({ ...settings, reducedMotion: on })}
          theme={settings.theme}
          onTheme={(id) => props.onSettingsChange({ ...settings, theme: id })}
          onReplaceToken={() => {
            setCfgOpen(false);
            props.onReplaceToken();
          }}
          onForgetToken={() => {
            setCfgOpen(false);
            props.onForgetToken();
          }}
          onLeaveDemo={() => {
            setCfgOpen(false);
            props.onLeaveDemo();
          }}
          onClose={() => setCfgOpen(false)}
        />
      ) : null}
    </View>
  );
}

/** The OS-level "reduce motion" accessibility setting (prefers-reduced-motion on web). */
function useOsReduceMotion(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setOn(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return on;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
