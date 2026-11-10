// All Hive state transitions. Pure; useHive adds storage, clocks and the Todoist source around it.

import { freshDay, hiveFlowerId, hiveFlowers, hiveTaskIdOf } from '../domain/day';
import { appendLog, log } from '../domain/logLines';
import { mergeTodoist } from '../domain/sync';
import type { DayState, Flower, HiveTask, Landing } from '../domain/types';

export const HISTORY_CAP = 500;

export interface HiveState {
  /** Persist across days */
  tasks: HiveTask[];
  history: Landing[];
  /** Resets each day */
  day: DayState;
}

export type HiveAction =
  | { type: 'hydrate'; state: HiveState }
  | { type: 'newDay'; date: string; seed: number }
  | { type: 'addTask'; id: string; title: string; now: Date }
  | { type: 'deleteTask'; flowerId: string; now: Date }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string; now: Date }
  | { type: 'done'; id: string; now: Date }
  | { type: 'landed'; id: string; now: Date }
  | { type: 'shuffle'; seed: number; now: Date }
  | { type: 'synced'; incoming: Flower[]; todoistDone?: number; now: Date; boot?: boolean }
  | { type: 'syncFailed'; reason: string; now: Date }
  | { type: 'log'; lines: string[] };

export function initialHiveState(today: string, seed: number): HiveState {
  return { tasks: [], history: [], day: freshDay(today, seed) };
}

/** Everything on today's board: synced Todoist flowers + carried-over Hive tasks. */
export function boardFlowers(state: {
  tasks: readonly HiveTask[];
  day: Pick<DayState, 'date' | 'todoistFlowers'>;
}): Flower[] {
  return [...state.day.todoistFlowers, ...hiveFlowers(state.tasks, state.day.date)];
}

export function hiveReducer(state: HiveState, action: HiveAction): HiveState {
  const withDay = (day: Partial<DayState>): HiveState => ({
    ...state,
    day: { ...state.day, ...day },
  });
  const logged = (...lines: string[]) => appendLog(state.day.log, ...lines);
  const flower = (id: string) => boardFlowers(state).find((f) => f.id === id);

  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'newDay':
      // Hive tasks carry over automatically: they live in `tasks`, not in the day.
      return { ...state, day: freshDay(action.date, action.seed) };

    case 'addTask': {
      const task: HiveTask = {
        id: action.id,
        title: action.title,
        createdAt: action.now.toISOString(),
      };
      return {
        ...state,
        tasks: [...state.tasks, task],
        day: { ...state.day, log: logged(log.added(action.now, action.title)) },
      };
    }

    case 'deleteTask': {
      const taskId = hiveTaskIdOf(action.flowerId);
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state; // only Hive tasks can be deleted
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== task.id),
        day: {
          ...state.day,
          excluded: state.day.excluded.filter((x) => x !== action.flowerId),
          log: logged(log.deleted(action.now, task.title)),
        },
      };
    }

    case 'toggle': {
      if (!flower(action.id)) return state;
      const has = state.day.excluded.includes(action.id);
      return withDay({
        excluded: has
          ? state.day.excluded.filter((x) => x !== action.id)
          : [...state.day.excluded, action.id],
      });
    }

    case 'remove': {
      const f = flower(action.id);
      if (!f) return state;
      return withDay({
        excluded: exclude(state.day.excluded, f.id),
        log: logged(log.removed(action.now, f.title)),
      });
    }

    case 'done': {
      const f = flower(action.id);
      // DONE is for Hive tasks only. Todoist tasks are never changed from Hive.
      if (!f || f.source !== 'hive') return state;
      const at = action.now.toISOString();
      return {
        ...state,
        tasks: state.tasks.map((t) => (hiveFlowerId(t.id) === f.id ? { ...t, doneAt: at } : t)),
        day: {
          ...state.day,
          excluded: exclude(state.day.excluded, f.id),
          hiveDone: state.day.hiveDone + 1,
          log: logged(log.done(action.now, f.title)),
        },
      };
    }

    case 'landed': {
      const f = flower(action.id);
      if (!f) return state;
      const landing: Landing = {
        flowerId: f.id,
        title: f.title,
        projectName: f.projectName,
        color: f.color,
        at: action.now.toISOString(),
      };
      return {
        ...state,
        history: [landing, ...state.history].slice(0, HISTORY_CAP),
        day: { ...state.day, log: logged(log.landed(action.now, f.title, f.projectName)) },
      };
    }

    case 'shuffle':
      return withDay({ seed: action.seed, log: logged(log.shuffled(action.now)) });

    case 'synced': {
      const { flowers, added } = mergeTodoist(state.day.todoistFlowers, action.incoming);
      const hiveKept = hiveFlowers(state.tasks, state.day.date).length;
      const lines = [log.sync(action.now, added, hiveKept)];
      if (action.boot) {
        const late = flowers.filter((f) => (f.daysLate ?? 0) > 0 && !f.goneFromTodoist).length;
        lines.push(
          log.loadHive(action.now, hiveKept),
          log.overdue(action.now, late),
          log.ready(action.now),
        );
      }
      return withDay({
        todoistFlowers: flowers,
        ...(action.todoistDone !== undefined ? { todoistDone: action.todoistDone } : {}),
        log: logged(...lines),
      });
    }

    case 'syncFailed':
      return withDay({ log: logged(log.syncFailed(action.now, action.reason)) });

    case 'log':
      return withDay({ log: logged(...action.lines) });
  }
}

function exclude(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}
