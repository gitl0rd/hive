// Board state + spin playback for the UI. Domain functions decide; this hook only plays them.
// M5 adds persistence (Hive tasks, history, day state) around the same reducer.
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { boardCounts, eligibleIds, layoutItems } from '../domain/board';
import { type BoardLayout, layoutBoard } from '../domain/hexLayout';
import { log } from '../domain/logLines';
import { planSpin } from '../domain/spinPlan';
import { spinTimeline } from '../domain/timeline';
import type { Flower, Landing } from '../domain/types';
import {
  sampleDone,
  sampleFlowers,
  sampleHistory,
  sampleLog,
  sampleSeed,
} from '../demo/sampleData';
import { boardReducer, type BoardState } from '../store/boardReducer';
import { todoistAppUrl, todoistTaskId, todoistWebUrl } from '../todoist/links';

export type Phase = 'idle' | 'flying' | 'landed';

/** Where the bee is: flying from cell `from` to cell `to` (-1 = home by the SPIN bar), `step` of 6 done. */
export interface BeeState {
  from: number;
  to: number;
  step: number;
}

export interface SpinView {
  phase: Phase;
  bee: BeeState;
  /** Recent cells visited, oldest first (for the dotted trail) */
  trail: number[];
  /** Cell index of the winner once landed, else -1 */
  winner: number;
}

const HOME: BeeState = { from: -1, to: -1, step: 6 };
const IDLE: SpinView = { phase: 'idle', bee: HOME, trail: [], winner: -1 };
const TRAIL_CELLS = 5;

export interface BoardModel {
  flowers: Flower[];
  layout: BoardLayout;
  excluded: ReadonlySet<string>;
  included: ReadonlySet<string>;
  counts: { flowers: number; late: number };
  log: string[];
  history: Landing[];
  done: number;
  spin: SpinView;
  /** The winning flower once landed */
  winner: Flower | null;
  actions: {
    spin: () => void;
    toggle: (id: string) => void;
    /** Landing actions */
    open: () => void;
    done: () => void;
    remove: () => void;
  };
}

const initialState = (): BoardState => ({
  flowers: sampleFlowers,
  excluded: [],
  log: sampleLog,
  history: sampleHistory,
  hiveDone: 0,
  todoistDone: sampleDone,
  seed: sampleSeed,
});

export function useBoard(): BoardModel {
  const [state, dispatch] = useReducer(boardReducer, undefined, initialState);
  // Flight state is tied to the layout it was planned on. If the layout changes (task added,
  // deleted, shuffled) the cell indices are stale, so the board reads as idle again.
  const [flight, setFlight] = useState<{ layout: BoardLayout | null; view: SpinView }>({
    layout: null,
    view: IDLE,
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const layout = useMemo(
    () => layoutBoard(state.seed, layoutItems(state.flowers)),
    [state.seed, state.flowers],
  );
  const view = flight.layout === layout ? flight.view : IDLE;
  const setView = (update: (v: SpinView) => SpinView) =>
    setFlight((f) => ({ layout: f.layout, view: update(f.view) }));
  // Stop any flight when the layout changes or the board unmounts.
  useEffect(() => clearTimers, [layout]);

  const excluded = useMemo(() => new Set(state.excluded), [state.excluded]);
  const included = useMemo(
    () => eligibleIds(state.flowers, state.excluded),
    [state.flowers, state.excluded],
  );
  const byId = useMemo(() => new Map(state.flowers.map((f) => [f.id, f])), [state.flowers]);

  const spin = useCallback(() => {
    if (view.phase === 'flying') return;
    const start = view.phase === 'landed' ? view.winner : -1;
    const plan = planSpin(layout, included, Math.random, start);
    const now = new Date();
    if (!plan) {
      dispatch({ type: 'log', lines: [log.nothingToSpin(now)] });
      return;
    }
    clearTimers();
    dispatch({ type: 'log', lines: [log.dispatch(now)] });
    setFlight({
      layout,
      view: { phase: 'flying', bee: { from: start, to: start, step: 6 }, trail: [], winner: -1 },
    });

    for (const ev of spinTimeline(plan)) {
      timers.current.push(
        setTimeout(() => {
          if (ev.type === 'hop') {
            const cell = plan.hops[ev.hop].cellIndex;
            const title = byId.get(layout.cells[cell].flowerId)?.title ?? '';
            dispatch({ type: 'log', lines: [log.hop(ev.hop + 1, title)] });
            setView((v) => ({
              ...v,
              bee: { from: v.bee.to, to: cell, step: 0 },
              trail: [...v.trail, cell].slice(-(TRAIL_CELLS + 1)),
            }));
          } else if (ev.type === 'step') {
            setView((v) => ({ ...v, bee: { ...v.bee, step: ev.step } }));
          } else {
            setView((v) => ({ ...v, phase: 'landed', winner: plan.winnerCellIndex, trail: [] }));
            dispatch({ type: 'landed', id: plan.winnerFlowerId, now: new Date() });
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            }
          }
        }, ev.atMs),
      );
    }
  }, [layout, included, byId, view]);

  const winner =
    view.phase === 'landed' && view.winner >= 0
      ? (byId.get(layout.cells[view.winner]?.flowerId) ?? null)
      : null;

  const settle = useCallback(() => {
    clearTimers();
    setFlight((f) => ({ layout: f.layout, view: IDLE }));
  }, []);

  const actions = useMemo(
    () => ({
      spin,
      toggle: (id: string) => dispatch({ type: 'toggle', id }),
      open: () => {
        const taskId = winner ? todoistTaskId(winner.id) : null;
        if (taskId) void openTodoistTask(taskId);
      },
      done: () => {
        if (!winner) return;
        dispatch({ type: 'done', id: winner.id, now: new Date() });
        settle();
      },
      remove: () => {
        if (!winner) return;
        dispatch({ type: 'remove', id: winner.id, now: new Date() });
        settle();
      },
    }),
    [spin, winner, settle],
  );

  return {
    flowers: state.flowers,
    layout,
    excluded,
    included,
    counts: boardCounts(state.flowers, state.excluded),
    log: state.log,
    history: state.history,
    done: state.hiveDone + state.todoistDone,
    spin: view,
    winner,
    actions,
  };
}

async function openTodoistTask(taskId: string) {
  const web = todoistWebUrl(taskId);
  if (Platform.OS === 'android') {
    try {
      await Linking.openURL(todoistAppUrl(taskId));
      return;
    } catch {
      // app not installed / link not handled: fall through to the web URL
    }
  }
  await Linking.openURL(web).catch(() => {});
}
