import { layoutBoard } from '../hexLayout';
import { mulberry32 } from '../random';
import { planDurationMs, planSpin, SPIN } from '../spinPlan';
import { instantTimeline, spinTimeline } from '../timeline';

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `f${i}`, group: 'g' }));

describe('spinTimeline', () => {
  const plan = planSpin(
    layoutBoard(4, items(9)),
    new Set(items(9).map((x) => x.id)),
    mulberry32(4),
  )!;
  const ev = spinTimeline(plan);

  it('is in time order and ends with a single land', () => {
    for (let i = 1; i < ev.length; i++) expect(ev[i].atMs).toBeGreaterThanOrEqual(ev[i - 1].atMs);
    expect(ev.filter((e) => e.type === 'land')).toHaveLength(1);
    expect(ev[ev.length - 1].type).toBe('land');
    expect(ev[ev.length - 1].atMs).toBe(Math.round(planDurationMs(plan)));
  });

  it('has one hop event and SPIN.steps steps per hop, steps after their hop', () => {
    const hops = ev.filter((e) => e.type === 'hop');
    expect(hops).toHaveLength(plan.hops.length);
    plan.hops.forEach((_, i) => {
      const steps = ev.filter((e) => e.type === 'step' && e.hop === i);
      expect(steps).toHaveLength(SPIN.steps);
      const start = ev.find((e) => e.type === 'hop' && e.hop === i)!.atMs;
      steps.forEach((s) => expect(s.atMs).toBeGreaterThanOrEqual(start));
    });
  });

  it('finishes each move before the next hop starts', () => {
    plan.hops.forEach((_, i) => {
      if (i === plan.hops.length - 1) return;
      const lastStep = ev.filter((e) => e.type === 'step' && e.hop === i).pop()!;
      const next = ev.find((e) => e.type === 'hop' && e.hop === i + 1)!;
      expect(lastStep.atMs).toBeLessThanOrEqual(next.atMs);
    });
  });

  it('instant timeline lands on the winner at once', () => {
    const inst = instantTimeline(plan);
    expect(inst.every((e) => e.atMs === 0)).toBe(true);
    expect(inst[0]).toEqual({ atMs: 0, type: 'hop', hop: plan.hops.length - 1 });
    expect(inst[inst.length - 1].type).toBe('land');
  });
});
