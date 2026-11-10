// Spin choreography (docs/PLAN.md §6 "Spin"). Pure: the UI only plays what this returns.

import { type BoardLayout, occupiedNeighbourIndices } from './hexLayout';
import { pick, randInt, type Rng } from './random';

export type HopKind = 'hop' | 'fakeout' | 'land';

export interface Hop {
  cellIndex: number;
  kind: HopKind;
  /** Time from the previous hop's start (or spin start) to this hop's start. */
  delayMs: number;
  /** How long the flight to this cell takes; played as STEPS discrete steps. */
  moveMs: number;
}

export interface SpinPlan {
  winnerFlowerId: string;
  winnerCellIndex: number;
  hops: Hop[];
  /** Pause after landing before the result is shown. */
  settleMs: number;
}

export const SPIN = {
  minHops: 15,
  maxHops: 20,
  neighbourChance: 0.65,
  /** Chance of a fake-out hop next to the winner before landing. */
  fakeoutChance: 0.5,
  fakeoutPauseMs: 820,
  settleMs: 520,
  maxMoveMs: 460,
  moveFraction: 0.85,
  steps: 6,
} as const;

/** Gap after random hop k of n: 70 + 520 * (k/n)^2.4 ms. */
export function hopGap(k: number, n: number): number {
  return 70 + 520 * Math.pow(k / n, 2.4);
}

function moveFor(prevGap: number): number {
  return Math.min(prevGap * SPIN.moveFraction, SPIN.maxMoveMs);
}

/**
 * Plan a spin. Returns null if nothing is eligible.
 *
 * - Winner: uniform over eligible flowers.
 * - n random hops (15–20) over any occupied cell; 65% go to a neighbour. Never the same cell twice
 *   in a row.
 * - Then (50% of the time) a fake-out onto a neighbour of the winner, then the winner.
 */
export function planSpin(
  layout: BoardLayout,
  eligibleFlowerIds: ReadonlySet<string>,
  rng: Rng,
): SpinPlan | null {
  const eligibleCells = layout.cells
    .map((c, i) => (eligibleFlowerIds.has(c.flowerId) ? i : -1))
    .filter((i) => i >= 0);
  if (eligibleCells.length === 0) return null;

  const winner = pick(rng, eligibleCells);
  const base = { winnerFlowerId: layout.cells[winner].flowerId, winnerCellIndex: winner };

  // Only one cell on the board: nowhere to fly but home.
  if (layout.cells.length === 1) {
    return {
      ...base,
      hops: [{ cellIndex: winner, kind: 'land', delayMs: 0, moveMs: moveFor(hopGap(0, 1)) }],
      settleMs: SPIN.settleMs,
    };
  }

  const all = layout.cells.map((_, i) => i);
  const nbCache = new Map<number, number[]>();
  const nbs = (i: number) => {
    let v = nbCache.get(i);
    if (!v) nbCache.set(i, (v = occupiedNeighbourIndices(layout, i)));
    return v;
  };

  const n = randInt(rng, SPIN.minHops, SPIN.maxHops);
  const path: number[] = [];
  let prev = -1;
  for (let k = 1; k <= n; k++) {
    const nearby = prev >= 0 ? nbs(prev) : [];
    const pool =
      nearby.length > 0 && rng() < SPIN.neighbourChance ? nearby : all.filter((i) => i !== prev);
    let next = pick(rng, pool);
    if (k === n && next === winner) {
      // The last random hop must not be the winner, or the final approach would repeat it.
      const alt = all.filter((i) => i !== winner && i !== prev);
      if (alt.length === 0) break; // e.g. 2 cells: we're already next to the winner
      next = pick(rng, alt);
    }
    path.push(next);
    prev = next;
  }

  const hops: Hop[] = [];
  let prevGap = hopGap(0, n);
  path.forEach((cellIndex, idx) => {
    const k = idx + 1;
    hops.push({
      cellIndex,
      kind: 'hop',
      delayMs: idx === 0 ? 0 : prevGap,
      moveMs: moveFor(prevGap),
    });
    prevGap = hopGap(k, n);
  });

  // Sometimes a fake-out: a neighbour of the winner, not the cell we're on.
  const fakeouts = nbs(winner).filter((i) => i !== prev);
  if (fakeouts.length > 0 && rng() < SPIN.fakeoutChance) {
    hops.push({
      cellIndex: pick(rng, fakeouts),
      kind: 'fakeout',
      delayMs: prevGap,
      moveMs: moveFor(prevGap),
    });
    prevGap = SPIN.fakeoutPauseMs;
  }

  hops.push({ cellIndex: winner, kind: 'land', delayMs: prevGap, moveMs: moveFor(prevGap) });
  return { ...base, hops, settleMs: SPIN.settleMs };
}

/** Total duration from SPIN to the result showing. */
export function planDurationMs(plan: SpinPlan): number {
  const starts = plan.hops.reduce((t, h) => t + h.delayMs, 0);
  const last = plan.hops[plan.hops.length - 1];
  return starts + last.moveMs + plan.settleMs;
}
