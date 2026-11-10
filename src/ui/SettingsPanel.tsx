import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Mode } from '../store/settings';
import { TermButton } from './Button';
import { Frame } from './Frame';
import { THEMES, type ThemeId, type ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useThemedStyles } from './ThemeContext';

/** Settings (cog in the footer): theme, replace/forget the token, switch Demo ↔ Todoist, haptics. */
export function SettingsPanel({
  mode,
  haptics,
  onHaptics,
  reducedMotion,
  osReduceMotion,
  onReducedMotion,
  theme,
  onTheme,
  onReplaceToken,
  onForgetToken,
  onLeaveDemo,
  onClose,
}: {
  mode: Mode;
  haptics: boolean;
  onHaptics: (on: boolean) => void;
  reducedMotion: boolean;
  osReduceMotion: boolean;
  onReducedMotion: (on: boolean) => void;
  theme: ThemeId;
  onTheme: (id: ThemeId) => void;
  onReplaceToken: () => void;
  onForgetToken: () => void;
  onLeaveDemo: () => void;
  onClose: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const [confirmForget, setConfirmForget] = useState(false);

  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <Frame title="CFG.SYS" style={styles.win} tagSize={22}>
        <Text style={styles.line}>
          MODE: {mode === 'demo' ? 'DEMO (SAMPLE TASKS)' : 'TODOIST · READ-ONLY · TOKEN SAVED'}
        </Text>

        {mode === 'todoist' ? (
          <>
            <TermButton
              label="[ REPLACE TOKEN ]"
              onPress={onReplaceToken}
              height={48}
              fontSize={22}
            />
            <TermButton
              label={confirmForget ? '[ CONFIRM: FORGET TOKEN ]' : '[ FORGET TOKEN ]'}
              filled={confirmForget}
              onPress={() => (confirmForget ? onForgetToken() : setConfirmForget(true))}
              height={48}
              fontSize={22}
              accessibilityLabel={confirmForget ? 'Confirm forget token' : 'Forget token'}
            />
            {confirmForget ? (
              <Text style={styles.note}>
                REMOVES THE TOKEN FROM THIS DEVICE. YOUR HIVE TASKS AND HISTORY STAY.
              </Text>
            ) : null}
          </>
        ) : (
          <TermButton label="[ CONNECT TODOIST ]" onPress={onLeaveDemo} height={48} fontSize={22} />
        )}

        <View accessibilityRole="radiogroup" accessibilityLabel="Theme" style={styles.group}>
          <Text style={styles.line}>THEME:</Text>
          {THEMES.map((th) => {
            const on = th.id === theme;
            return (
              <Pressable
                key={th.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${th.name} theme`}
                onPress={() => onTheme(th.id)}
                style={styles.toggle}
                testID={`theme-${th.id}`}
              >
                <Text style={styles.line}>
                  {on ? '(•)' : '( )'} {th.name}
                </Text>
                <Text style={styles.note}>
                  {'    '}
                  {th.blurb}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: haptics }}
          accessibilityLabel="Haptics on landing"
          onPress={() => onHaptics(!haptics)}
          style={styles.toggle}
        >
          <Text style={styles.line}>
            {haptics ? '[x]' : '[ ]'} HAPTICS ON LANDING
            {Platform.OS === 'web' ? '  (PHONE ONLY)' : ''}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: reducedMotion || osReduceMotion,
            disabled: osReduceMotion,
          }}
          accessibilityLabel="Reduced motion: land instantly"
          disabled={osReduceMotion}
          onPress={() => onReducedMotion(!reducedMotion)}
          style={styles.toggle}
        >
          <Text style={styles.line}>
            {reducedMotion || osReduceMotion ? '[x]' : '[ ]'} REDUCED MOTION (INSTANT LANDING)
          </Text>
          {osReduceMotion ? (
            <Text style={styles.note}>ON BECAUSE YOUR DEVICE ASKS FOR REDUCED MOTION.</Text>
          ) : null}
        </Pressable>

        <TermButton label="[ CLOSE ]" onPress={onClose} height={48} fontSize={22} />
      </Frame>
    </View>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.bgA(0.92),
      alignItems: 'center',
      justifyContent: 'center',
      padding: 22,
    },
    win: {
      width: '100%',
      maxWidth: 520,
      paddingTop: 28,
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
      backgroundColor: t.bg,
    },
    line: {
      fontFamily: fonts.display,
      fontSize: 22,
      color: t.screen,
      letterSpacing: 1,
      ...t.glow,
    },
    note: { fontFamily: fonts.display, fontSize: 18, color: t.screen, opacity: 0.7, ...t.glow },
    group: { gap: 2 },
    toggle: { minHeight: 44, justifyContent: 'center' },
  });
