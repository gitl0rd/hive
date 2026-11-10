// Board state transitions. Pure; the UI hook adds timers/IO around it. (M5 adds persistence.)

import { appendLog, log } from '../domain/logLines';
import type { Flower, Landing } from '../domain/types';

export const HISTORY_CAP = 500;

export interface BoardState {
  flowers: Flower[];
  excluded: string[];
  log: string[];
  history: Landing[];
  /** Hive tasks marked DONE today */
  hiveDone: number;
  /** Todoist tasks completed today (from the API, M6) */
  todoistDone: number;
  seed: number;
}

export type BoardAction =
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string; now: Date }
  | { type: 'done'; id: string; now: Date }
  | { type: 'log'; lines: string[] }
  | { type: 'landed'; id: string; now: Date };

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'toggle': {
      const has = state.excluded.includes(action.id);
      return {
        ...state,
        excluded: has
          ? state.excluded.filter((x) => x !== action.id)
          : [...state.excluded, action.id],
      };
    }
    case 'remove': {
      const f = state.flowers.find((x) => x.id === action.id);
      if (!f) return state;
      return {
        ...state,
        excluded: exclude(state.excluded, f.id),
        log: appendLog(state.log, log.removed(action.now, f.title)),
      };
    }
    case 'done': {
      const f = state.flowers.find((x) => x.id === action.id);
      // DONE is for Hive tasks only. Todoist tasks are never changed from Hive.
      if (!f || f.source !== 'hive') return state;
      return {
        ...state,
        excluded: exclude(state.excluded, f.id),
        hiveDone: state.hiveDone + 1,
        log: appendLog(state.log, log.done(action.now, f.title)),
      };
    }
    case 'log':
      return { ...state, log: appendLog(state.log, ...action.lines) };
    case 'landed': {
      const f = state.flowers.find((x) => x.id === action.id);
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
        log: appendLog(state.log, log.landed(action.now, f.title, f.projectName)),
      };
    }
  }
}

function exclude(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}
