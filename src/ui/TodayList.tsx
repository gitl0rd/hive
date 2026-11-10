import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { lateTag, projectCode } from '../domain/labels';
import type { Flower } from '../domain/types';
import { TermButton } from './Button';
import { itemColor, type ThemeTokens } from '../themes';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';

export interface TodayListProps {
  flowers: Flower[];
  excluded: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  /** Hive task: delete. Todoist task: hide for today. */
  onDelete?: (id: string) => void;
  /** Todoist tasks hidden today, and how to bring them back */
  hiddenCount?: number;
  onUnhide?: () => void;
  onAdd?: (title: string) => void;
  onSync?: () => void;
  /** 22 (mobile) / 24 (desktop) */
  fontSize?: number;
  /** Winner's row renders in inverse video */
  highlightId?: string;
  /** Bee in flight: no edits until it lands */
  locked?: boolean;
}

/** TODAY: include/exclude toggles, Hive DEL, Todoist HIDE (today only), ADD, SYNC. */
export function TodayList({
  flowers,
  excluded,
  onToggle,
  onDelete,
  hiddenCount = 0,
  onUnhide,
  onAdd,
  onSync,
  fontSize = 22,
  highlightId,
  locked = false,
}: TodayListProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [draft, setDraft] = useState('');
  const submit = () => {
    const t = draft.trim();
    if (!t || locked) return;
    onAdd?.(t);
    setDraft('');
  };
  const text = { fontSize, lineHeight: fontSize * 1.1 };

  return (
    <View style={styles.wrap}>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {flowers.map((f) => {
          const on = !excluded.has(f.id);
          const inv = f.id === highlightId;
          const ink = inv ? { color: theme.bg, ...theme.noGlow } : null;
          const color = itemColor(f.color, f.source === 'hive', theme);
          return (
            <View key={f.id} style={styles.row}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: locked }}
                disabled={locked}
                accessibilityLabel={`${on ? 'Exclude' : 'Include'} ${f.title}`}
                onPress={() => onToggle?.(f.id)}
                style={[
                  styles.rowBtn,
                  { opacity: on ? 1 : 0.4 },
                  inv ? { backgroundColor: theme.screen } : null,
                ]}
                testID={`toggle-${f.id}`}
              >
                <Text style={[styles.t, text, ink]}>{on ? '[x]' : '[ ]'}</Text>
                <Text style={[styles.t, text, styles.title, on ? null : styles.struck, ink]}>
                  {f.title.toUpperCase()}
                </Text>
                {f.daysLate ? (
                  <Text style={[styles.t, text, { opacity: 0.85 }, ink]}>
                    {lateTag(f.daysLate)}
                  </Text>
                ) : null}
                <Text style={[styles.t, text, inv ? ink : { color, textShadowColor: color }]}>
                  {projectCode(f.projectName)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${f.source === 'hive' ? 'Delete' : 'Hide for today'} ${f.title}`}
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => onDelete?.(f.id)}
                style={[styles.del, locked ? styles.lockedCtl : null]}
                testID={`${f.source === 'hive' ? 'del' : 'hide'}-${f.id}`}
              >
                <Text style={[styles.t, { fontSize: fontSize - 4, opacity: 0.7 }]}>
                  {f.source === 'hive' ? 'DEL' : 'HIDE'}
                </Text>
              </Pressable>
            </View>
          );
        })}
        {hiddenCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show ${hiddenCount} hidden Todoist task${hiddenCount === 1 ? '' : 's'}`}
            accessibilityState={{ disabled: locked }}
            disabled={locked}
            onPress={onUnhide}
            style={[styles.hiddenRow, locked ? styles.lockedCtl : null]}
            testID="unhide"
          >
            <Text style={[styles.t, { fontSize: fontSize - 6, opacity: 0.6, letterSpacing: 1.5 }]}>
              {`${hiddenCount} HIDDEN TODAY · [UNHIDE]`}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.cmdRow}>
        <Text style={[styles.t, text]} nativeID="add-label">
          {'> ADD:'}
        </Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder={locked ? theme.theme.words.lockedPlaceholder : 'new hive task'}
          editable={!locked}
          placeholderTextColor={theme.a(0.4)}
          accessibilityLabel="New Hive task"
          accessibilityLabelledBy="add-label"
          returnKeyType="done"
          style={[styles.input, { fontSize }]}
          testID="add-input"
        />
        <TermButton
          label="OK"
          onPress={submit}
          disabled={locked}
          height={40}
          fontSize={fontSize}
          style={styles.ok}
          accessibilityLabel="Add task"
        />
      </View>
      <TermButton
        label="[ SYNC TODOIST ]"
        onPress={onSync}
        disabled={locked}
        height={44}
        fontSize={fontSize}
        accessibilityLabel="Sync Todoist"
      />
      <Text style={[styles.note, { fontSize: fontSize - 6 }]}>
        PULLS NEW TASKS ONLY · HIVE TASKS KEPT
      </Text>
    </View>
  );
}

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    wrap: { flex: 1, gap: 6, minHeight: 0 },
    list: { flex: 1 },
    listContent: { paddingBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBtn: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 8,
    },
    t: { fontFamily: fonts.display, color: t.screen, ...t.glow },
    title: { flex: 1, minWidth: 0 },
    struck: { textDecorationLine: 'line-through' },
    hiddenRow: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
    del: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
    lockedCtl: { opacity: 0.35 },
    cmdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
    input: {
      flex: 1,
      minWidth: 0,
      height: 40,
      borderBottomWidth: 2,
      borderBottomColor: t.a(0.5),
      color: t.screen,
      fontFamily: fonts.display,
      paddingHorizontal: 4,
      ...t.glow,
    },
    ok: { minWidth: 60, backgroundColor: t.a(0.1) },
    note: {
      fontFamily: fonts.display,
      color: t.screen,
      opacity: 0.6,
      letterSpacing: 1.5,
      textAlign: 'center',
      ...t.glow,
    },
  });
