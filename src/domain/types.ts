// Core data model (docs/PLAN.md §5). Pure types, no runtime code.

export type Source = 'todoist' | 'hive';

/** One cell on the board. */
export interface Flower {
  /** 'todoist:123' or 'hive:<uuid>' */
  id: string;
  source: Source;
  title: string;
  /** Todoist project id, or 'hive' */
  projectKey: string;
  /** 'Mega Dog', 'Inbox', 'Hive' */
  projectName: string;
  /** Display hex, already brightened for the dark background */
  color: string;
  daysLate?: number;
  /** Synced earlier but no longer returned (done/rescheduled in Todoist). Kept, dimmed, never spun. */
  goneFromTodoist?: boolean;
}

/** Persists across days. */
export interface HiveTask {
  id: string;
  title: string;
  createdAt: string;
  doneAt?: string;
}

export interface Landing {
  flowerId: string;
  title: string;
  projectName: string;
  color: string;
  at: string;
}

/** Keyed by local date 'YYYY-MM-DD'; resets each day. */
export interface DayState {
  date: string;
  /** What's been synced today */
  todoistFlowers: Flower[];
  /** Flower ids toggled off / removed for today */
  excluded: string[];
  /** Hive tasks marked DONE today */
  hiveDone: number;
  /** Flight log lines (cap 200) */
  log: string[];
  /** Board layout seed (Shuffle changes it) */
  seed: number;
}

export const HIVE_PROJECT_KEY = 'hive';
