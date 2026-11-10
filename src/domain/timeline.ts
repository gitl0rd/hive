// Turns a SpinPlan into absolute-time events the UI can schedule. Pure.

import { SPIN, type SpinPlan } from './spinPlan';

export type SpinEvent =
  /** Bee leaves for hop `hop` (index into plan.hops). Log the hop line now. */
  | { atMs: number; type: 'hop'; hop: number }
  /** Bee has covered `step` of SPIN.steps of the way to hop `hop`. */
  | { atMs: number; type: 'step'; hop: number; step: number }
  /** Settled: show the result. */
  | { atMs: number; type: 'land' };

export function spinTimeline(plan: SpinPlan, steps: number = SPIN.steps): SpinEvent[] {
  const events: SpinEvent[] = [];
  let t = 0;
  plan.hops.forEach((h, i) => {
    t += h.delayMs;
    events.push({ atMs: Math.round(t), type: 'hop', hop: i });
    for (let k = 1; k <= steps; k++) {
      events.push({ atMs: Math.round(t + (h.moveMs * k) / steps), type: 'step', hop: i, step: k });
    }
  });
  const last = plan.hops[plan.hops.length - 1];
  events.push({ atMs: Math.round(t + last.moveMs + plan.settleMs), type: 'land' });
  return events;
}

/** Landing straight away (reduced motion / instant mode). */
export function instantTimeline(plan: SpinPlan): SpinEvent[] {
  const last = plan.hops.length - 1;
  return [
    { atMs: 0, type: 'hop', hop: last },
    { atMs: 0, type: 'step', hop: last, step: SPIN.steps },
    { atMs: 0, type: 'land' },
  ];
}
