import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, glow, noGlow } from './theme';

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
              { backgroundColor: on ? colors.screen : colors.bg, opacity: on ? 1 : 0.7 },
            ]}
          >
            <Text style={[styles.ftabText, on ? { color: colors.bg, ...noGlow } : null]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.screen,
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
  tabOn: { borderColor: colors.screen, paddingBottom: 2, backgroundColor: colors.bg },
  tabText: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 2,
    color: colors.screen,
    ...glow,
  },
  ftab: {
    height: 32,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.screen,
  },
  ftabText: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 2,
    color: colors.screen,
    ...glow,
  },
});
