import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { lateTag, projectCode } from '../domain/labels';
import type { Flower } from '../domain/types';
import { TermButton } from './Button';
import { a, colors, fonts, glow, noGlow } from './theme';

export interface TodayListProps {
  flowers: Flower[];
  excluded: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (title: string) => void;
  onSync?: () => void;
  /** 22 (mobile) / 24 (desktop) */
  fontSize?: number;
  /** Winner's row renders in inverse video */
  highlightId?: string;
  /** Bee in flight: no edits until it lands */
  locked?: boolean;
}

/** TODAY: include/exclude toggles, Hive DEL, ADD, SYNC. */
export function TodayList({
  flowers,
  excluded,
  onToggle,
  onDelete,
  onAdd,
  onSync,
  fontSize = 22,
  highlightId,
  locked = false,
}: TodayListProps) {
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
          const ink = inv ? { color: colors.bg, ...noGlow } : null;
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
                  inv ? { backgroundColor: colors.screen } : null,
                ]}
                testID={`toggle-${f.id}`}
              >
                <Text style={[styles.t, text, ink]}>{on ? '[x]' : '[ ]'}</Text>
                <Text
                  style={[styles.t, text, styles.title, on ? null : styles.struck, ink]}
                  numberOfLines={1}
                >
                  {f.title.toUpperCase()}
                </Text>
                {f.daysLate ? (
                  <Text style={[styles.t, text, { opacity: 0.85 }, ink]}>
                    {lateTag(f.daysLate)}
                  </Text>
                ) : null}
                <Text
                  style={[styles.t, text, inv ? ink : { color: f.color, textShadowColor: f.color }]}
                >
                  {projectCode(f.projectName)}
                </Text>
              </Pressable>
              {f.source === 'hive' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${f.title}`}
                  accessibilityState={{ disabled: locked }}
                  disabled={locked}
                  onPress={() => onDelete?.(f.id)}
                  style={[styles.del, locked ? styles.lockedCtl : null]}
                  testID={`del-${f.id}`}
                >
                  <Text style={[styles.t, { fontSize: fontSize - 4, opacity: 0.7 }]}>DEL</Text>
                </Pressable>
              ) : (
                <View style={styles.del} />
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.cmdRow}>
        <Text style={[styles.t, text]} nativeID="add-label">
          {'> ADD:'}
        </Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder={locked ? 'bee in flight…' : 'new hive task'}
          editable={!locked}
          placeholderTextColor={a(0.4)}
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

const styles = StyleSheet.create({
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
  t: { fontFamily: fonts.display, color: colors.screen, ...glow },
  title: { flex: 1, minWidth: 0 },
  struck: { textDecorationLine: 'line-through' },
  del: { width: 52, height: 44, alignItems: 'center', justifyContent: 'center' },
  lockedCtl: { opacity: 0.35 },
  cmdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderBottomWidth: 2,
    borderBottomColor: a(0.5),
    color: colors.screen,
    fontFamily: fonts.display,
    paddingHorizontal: 4,
    ...glow,
  },
  ok: { minWidth: 60, backgroundColor: a(0.1) },
  note: {
    fontFamily: fonts.display,
    color: colors.screen,
    opacity: 0.6,
    letterSpacing: 1.5,
    textAlign: 'center',
    ...glow,
  },
});
