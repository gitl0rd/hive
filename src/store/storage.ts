// Device storage for Hive state. AsyncStorage on every platform (localStorage on web).
// The Todoist token is NOT stored here: it goes through secure storage in M6.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DayState, Flower, HiveTask, Landing } from '../domain/types';

export const KEYS = {
  tasks: 'hive.tasks',
  history: 'hive.history',
  day: 'hive.day',
} as const;

const VERSION = 1;

interface Envelope<T> {
  v: number;
  data: T;
}

// ---- validation (stored data may be old, partial or hand-edited) ----

const isStr = (x: unknown): x is string => typeof x === 'string';
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object';

export function isHiveTask(x: unknown): x is HiveTask {
  return (
    isObj(x) &&
    isStr(x.id) &&
    isStr(x.title) &&
    isStr(x.createdAt) &&
    (x.doneAt === undefined || isStr(x.doneAt))
  );
}

export function isLanding(x: unknown): x is Landing {
  return (
    isObj(x) &&
    isStr(x.flowerId) &&
    isStr(x.title) &&
    isStr(x.projectName) &&
    isStr(x.color) &&
    isStr(x.at)
  );
}

export function isFlower(x: unknown): x is Flower {
  return (
    isObj(x) &&
    isStr(x.id) &&
    (x.source === 'todoist' || x.source === 'hive') &&
    isStr(x.title) &&
    isStr(x.projectKey) &&
    isStr(x.projectName) &&
    isStr(x.color) &&
    (x.daysLate === undefined || isNum(x.daysLate)) &&
    (x.goneFromTodoist === undefined || typeof x.goneFromTodoist === 'boolean')
  );
}

export function isDayState(x: unknown): x is DayState {
  return (
    isObj(x) &&
    isStr(x.date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(x.date) &&
    Array.isArray(x.todoistFlowers) &&
    x.todoistFlowers.every(isFlower) &&
    Array.isArray(x.excluded) &&
    x.excluded.every(isStr) &&
    isNum(x.hiveDone) &&
    Array.isArray(x.log) &&
    x.log.every(isStr) &&
    isNum(x.seed) &&
    (x.todoistDone === undefined || isNum(x.todoistDone))
  );
}

// ---- read / write ----

export interface Loaded {
  tasks: HiveTask[];
  history: Landing[];
  day: DayState | null;
  /** Keys that held unreadable data and were ignored */
  problems: string[];
}

async function read<T>(key: string, check: (x: unknown) => x is T): Promise<T | null | 'bad'> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    const env = JSON.parse(raw) as Envelope<unknown>;
    if (!isObj(env) || env.v !== VERSION || !check(env.data)) return 'bad';
    return env.data;
  } catch {
    return 'bad';
  }
}

const listOf =
  <T>(check: (x: unknown) => x is T) =>
  (x: unknown): x is T[] =>
    Array.isArray(x) && x.every(check);

export async function loadAll(): Promise<Loaded> {
  const [tasks, history, day] = await Promise.all([
    read(KEYS.tasks, listOf(isHiveTask)),
    read(KEYS.history, listOf(isLanding)),
    read(KEYS.day, isDayState),
  ]);
  const problems: string[] = [];
  if (tasks === 'bad') problems.push(KEYS.tasks);
  if (history === 'bad') problems.push(KEYS.history);
  if (day === 'bad') problems.push(KEYS.day);
  return {
    tasks: tasks && tasks !== 'bad' ? tasks : [],
    history: history && history !== 'bad' ? history : [],
    day: day && day !== 'bad' ? day : null,
    problems,
  };
}

async function write<T>(key: string, data: T): Promise<void> {
  const env: Envelope<T> = { v: VERSION, data };
  await AsyncStorage.setItem(key, JSON.stringify(env));
}

export const save = {
  tasks: (t: HiveTask[]) => write(KEYS.tasks, t),
  history: (h: Landing[]) => write(KEYS.history, h),
  day: (d: DayState) => write(KEYS.day, d),
};
