// Hive state with persistence and the day lifecycle (docs/PLAN.md §5, §6).
//
// - Loads tasks/history/day from storage on start.
// - New local day (or first run): fresh DayState with a new seed, then a boot sync.
// - Same day: keep the stored day and sync on open.
// - App returns to the foreground on a new day: roll over and sync.
// - Saves each slice when it changes.
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { cleanTitle, needsRollover } from '../domain/day';
import { localDateKey } from '../domain/dates';
import { newSeed } from '../domain/random';
import type { Flower } from '../domain/types';
import { boardFlowers, type HiveAction, hiveReducer, initialHiveState } from './hiveReducer';
import { loadAll, type Namespace, saver } from './storage';

/** Where Todoist flowers come from: the read-only API (M6) or demo data. */
export type TodoistSource = () => Promise<{ flowers: Flower[]; completedToday?: number }>;

export interface Hive {
  ready: boolean;
  state: ReturnType<typeof initialHiveState>;
  flowers: Flower[];
  dispatch: (a: HiveAction) => void;
  addTask: (title: string) => void;
  deleteTask: (flowerId: string) => void;
  shuffle: () => void;
  sync: () => Promise<void>;
}

export interface HiveOptions {
  /** Storage namespace ('hive.demo' keeps Demo mode apart from real data) */
  ns?: Namespace;
  /** Hive tasks to create on the very first run in this namespace (Demo mode) */
  seedTaskTitles?: string[];
}

export function useHive(source: TodoistSource, opts: HiveOptions = {}): Hive {
  const ns = opts.ns ?? 'hive';
  const seedTitles = opts.seedTaskTitles;
  const save = useMemo(() => saver(ns), [ns]);
  const [state, dispatch] = useReducer(hiveReducer, undefined, () =>
    initialHiveState(localDateKey(new Date()), newSeed()),
  );
  const [ready, setReady] = useState(false);

  // Latest values for async callbacks (updated after render, never during it).
  const stateRef = useRef(state);
  const sourceRef = useRef(source);
  useEffect(() => {
    stateRef.current = state;
    sourceRef.current = source;
  });
  const syncing = useRef(false);

  const runSync = useCallback(async (boot: boolean) => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const { flowers, completedToday } = await sourceRef.current();
      dispatch({
        type: 'synced',
        incoming: flowers,
        todoistDone: completedToday,
        now: new Date(),
        boot,
      });
    } catch (e) {
      dispatch({ type: 'syncFailed', reason: syncFailureReason(e), now: new Date() });
    } finally {
      syncing.current = false;
    }
  }, []);

  /** Start a new day if the stored one isn't today. Returns true if it rolled over. */
  const rolloverIfNeeded = useCallback(() => {
    const today = localDateKey(new Date());
    if (!needsRollover(stateRef.current.day, today)) return false;
    dispatch({ type: 'newDay', date: today, seed: newSeed() });
    return true;
  }, []);

  // Load once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadAll(ns).catch(() => null);
      if (cancelled) return;
      const today = localDateKey(new Date());
      const fresh = initialHiveState(today, newSeed());
      const day = loaded?.day && !needsRollover(loaded.day, today) ? loaded.day : fresh.day;
      const isNewDay = day === fresh.day;
      const seeded =
        loaded?.empty && seedTitles
          ? seedTitles.map((title) => ({
              id: Crypto.randomUUID(),
              title,
              createdAt: new Date().toISOString(),
            }))
          : null;
      dispatch({
        type: 'hydrate',
        state: { tasks: seeded ?? loaded?.tasks ?? [], history: loaded?.history ?? [], day },
      });
      if (loaded?.problems.length) {
        dispatch({
          type: 'log',
          lines: [`> ignored unreadable data: ${loaded.problems.join(', ')}`],
        });
      }
      setReady(true);
      await runSync(isNewDay);
    })();
    return () => {
      cancelled = true;
    };
    // Load once per namespace (seed titles are only read on first run).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSync, ns]);

  // Coming back to the app on a new day: roll over and sync.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && rolloverIfNeeded()) void runSync(true);
    });
    return () => sub.remove();
  }, [ready, rolloverIfNeeded, runSync]);

  // Persist each slice when it changes (only after loading, so we never overwrite stored data
  // with the empty initial state).
  useEffect(() => {
    if (ready) save.tasks(state.tasks).catch(() => {});
  }, [ready, save, state.tasks]);
  useEffect(() => {
    if (ready) save.history(state.history).catch(() => {});
  }, [ready, save, state.history]);
  useEffect(() => {
    if (ready) save.day(state.day).catch(() => {});
  }, [ready, save, state.day]);

  // Only recompute when the inputs change (not on log lines, exclusions, history...).
  const { todoistFlowers, date } = state.day;
  const { tasks } = state;
  const flowers = useMemo(
    () => boardFlowers({ tasks, day: { date, todoistFlowers } }),
    [tasks, date, todoistFlowers],
  );

  return {
    ready,
    state,
    flowers,
    dispatch,
    addTask: (raw: string) => {
      const title = cleanTitle(raw);
      if (!title) return;
      rolloverIfNeeded();
      dispatch({ type: 'addTask', id: Crypto.randomUUID(), title, now: new Date() });
    },
    deleteTask: (flowerId: string) => dispatch({ type: 'deleteTask', flowerId, now: new Date() }),
    shuffle: () => dispatch({ type: 'shuffle', seed: newSeed(), now: new Date() }),
    sync: async () => {
      const rolled = rolloverIfNeeded();
      await runSync(rolled);
    },
  };
}

export function syncFailureReason(e: unknown): string {
  const status = (e as { status?: number } | null)?.status;
  if (status === 401 || status === 403) return 'bad token';
  if (status) return `http ${status}`;
  return 'offline';
}
