// Coin flip: plan a flip, then describe the coin at any moment of it. Pure; the UI just plays it.
//
// The coin turns end over end (around its horizontal axis). Each half turn shows the other face,
// so the number of half turns decides which side lands up. It rises and falls on a parabola,
// growing a little as it comes "closer", and slows as it spins down.

import { randInt, type Rng } from './random';

export type CoinSide = 'heads' | 'tails';

export interface CoinFlipPlan {
  /** Side facing up when the flip started */
  from: CoinSide;
  /** Side facing up when it lands */
  side: CoinSide;
  /** Half turns (180° each). Even = lands on `from`, odd = the other side. */
  halfTurns: number;
  durationMs: number;
}

export interface CoinPose {
  /** Rotation so far, radians */
  angle: number;
  /** Height above the table, 0..1 (1 = top of the toss) */
  lift: number;
  /** Visible face (the one turned towards the viewer) */
  face: CoinSide;
  /** Apparent height of the face, |cos(angle)|; tiny when edge-on */
  squash: number;
  /** Sign of sin(angle): which way the coin's edge shows (+1 lower rim, -1 upper rim) */
  edge: number;
  done: boolean;
}

export const FLIP_MS = 1700;
/** Never draw the face thinner than this (a coin seen edge-on still has a rim) */
export const MIN_SQUASH = 0.06;

export const otherSide = (s: CoinSide): CoinSide => (s === 'heads' ? 'tails' : 'heads');

/** Fair flip: 50/50 outcome, then 5–6 full turns with the parity that lands on it. */
export function planFlip(rng: Rng, from: CoinSide = 'heads'): CoinFlipPlan {
  const side: CoinSide = rng() < 0.5 ? 'heads' : 'tails';
  const full = randInt(rng, 5, 6);
  const halfTurns = full * 2 + (side === from ? 0 : 1);
  return { from, side, halfTurns, durationMs: FLIP_MS };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Fast off the thumb, slowing at the end */
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

/** The coin `t` ms into the flip. t >= durationMs = landed. */
export function coinPose(plan: CoinFlipPlan, t: number): CoinPose {
  const p = clamp01(plan.durationMs > 0 ? t / plan.durationMs : 1);
  const done = p >= 1;
  const angle = done ? plan.halfTurns * Math.PI : plan.halfTurns * Math.PI * easeOutCubic(p);
  // Face flips each time the coin passes edge-on (every π, offset by π/2).
  const crossed = Math.floor(angle / Math.PI + 0.5);
  const face = done ? plan.side : crossed % 2 === 0 ? plan.from : otherSide(plan.from);
  return {
    angle,
    lift: done ? 0 : 4 * p * (1 - p),
    face,
    squash: Math.max(MIN_SQUASH, Math.abs(Math.cos(angle))),
    edge: Math.sin(angle) >= 0 ? 1 : -1,
    done,
  };
}

/** A coin lying still, `side` up. */
export function restingPose(side: CoinSide): CoinPose {
  return { angle: 0, lift: 0, face: side, squash: 1, edge: 1, done: true };
}

/** Tally of recent flips (newest first) for the result row. */
export function tally(results: readonly CoinSide[]): { heads: number; tails: number } {
  let heads = 0;
  for (const r of results) if (r === 'heads') heads++;
  return { heads, tails: results.length - heads };
}
