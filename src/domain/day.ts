// Day lifecycle and Hive task helpers (docs/PLAN.md §5). Pure.

import { log } from './logLines';
import {
  type DayState,
  type Flower,
  HIVE_COLOR,
  HIVE_PROJECT_KEY,
  HIVE_PROJECT_NAME,
  type HiveTask,
} from './types';
import { localDateKey } from './dates';

export function freshDay(date: string, seed: number): DayState {
  return {
    date,
    todoistFlowers: [],
    excluded: [],
    hiveDone: 0,
    log: [log.boot()],
    seed,
    todoistDone: 0,
  };
}

/** True if this stored day is not today (local) and a fresh day should start. */
export function needsRollover(day: DayState | null | undefined, today: string): boolean {
  return !day || day.date !== today;
}

export const hiveFlowerId = (taskId: string) => `hive:${taskId}`;
export const hiveTaskIdOf = (flowerId: string) =>
  flowerId.startsWith('hive:') ? flowerId.slice('hive:'.length) : null;

/** A task done on an earlier day is finished and leaves the board; done today it stays (dimmed). */
export function isFinished(task: HiveTask, today: string): boolean {
  return !!task.doneAt && localDateKey(new Date(task.doneAt)) < today;
}

/** Hive tasks that belong on today's board, as flowers. */
export function hiveFlowers(tasks: readonly HiveTask[], today: string): Flower[] {
  return tasks
    .filter((t) => !isFinished(t, today))
    .map((t) => ({
      id: hiveFlowerId(t.id),
      source: 'hive' as const,
      title: t.title,
      projectKey: HIVE_PROJECT_KEY,
      projectName: HIVE_PROJECT_NAME,
      color: HIVE_COLOR,
    }));
}

/** Clean a user-typed title: trim, collapse whitespace, cap length. Empty -> null. */
export function cleanTitle(raw: string, max = 120): string | null {
  const t = raw.replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : null;
}
