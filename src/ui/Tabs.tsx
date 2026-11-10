import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

/** Mobile bracket tabs: active tab boxed, sitting on a line. */
export function BracketTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(t.id)}
            style={[styles.tab, on ? styles.tabOn : null]}
          >
            <Text style={[styles.tabText, { opacity: on ? 1 : 0.55 }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Desktop frame tabs: small boxed buttons on a window's top edge; active one filled. */
export function FrameTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(t.id)}
            style={[
              styles.ftab,
              { backgroundColor: on ? th.screen : th.bg, opacity: on ? 1 : 0.7 },
            ]}
          >
            <Text style={[styles.ftabText, on ? { color: th.bg, ...th.noGlow } : null]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 6,
      borderBottomWidth: 2,
      borderBottomColor: t.screen,
    },
    tab: {
      height: 40,
      paddingHorizontal: 12,
      justifyContent: 'center',
      borderWidth: 2,
      borderBottomWidth: 0,
      borderColor: 'transparent',
      marginBottom: -2,
    },
    tabOn: { borderColor: t.screen, paddingBottom: 2, backgroundColor: t.bg },
    tabText: {
      fontFamily: fonts.display,
      fontSize: 24,
      letterSpacing: 2,
      color: t.screen,
      ...t.glow,
    },
    ftab: {
      height: 32,
      paddingHorizontal: 12,
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.screen,
    },
    ftabText: {
      fontFamily: fonts.display,
      fontSize: 22,
      letterSpacing: 2,
      color: t.screen,
      ...t.glow,
    },
  });
