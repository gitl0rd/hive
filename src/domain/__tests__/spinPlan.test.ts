import { layoutBoard } from '../hexLayout';
import { mulberry32 } from '../random';
import { hopGap, planDurationMs, planSpin, SPIN } from '../spinPlan';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `f${i}`);
const items = (n: number) => ids(n).map((id, i) => ({ id, group: `p${i % 3}` }));

function check(n: number, eligible: string[], seed: number) {
  const layout = layoutBoard(seed, items(n));
  const plan = planSpin(layout, new Set(eligible), mulberry32(seed * 31 + 1));
  expect(plan).not.toBeNull();
  const p = plan!;
  // winner always eligible
  expect(eligible).toContain(p.winnerFlowerId);
  expect(layout.cells[p.winnerCellIndex].flowerId).toBe(p.winnerFlowerId);
  // last hop = winner, and it's the only 'land'
  const last = p.hops[p.hops.length - 1];
  expect(last.cellIndex).toBe(p.winnerCellIndex);
  expect(last.kind).toBe('land');
  expect(p.hops.filter((h) => h.kind === 'land')).toHaveLength(1);
  // no consecutive repeats
  for (let i = 1; i < p.hops.length; i++) {
    expect(p.hops[i].cellIndex).not.toBe(p.hops[i - 1].cellIndex);
  }
  // timings sane
  for (const h of p.hops) {
    expect(h.moveMs).toBeGreaterThan(0);
    expect(h.moveMs).toBeLessThanOrEqual(SPIN.maxMoveMs);
    expect(h.delayMs).toBeGreaterThanOrEqual(0);
  }
  expect(p.hops[0].delayMs).toBe(0);
  return { layout, plan: p };
}

describe('planSpin', () => {
  it('returns null with 0 eligible', () => {
    expect(planSpin(layoutBoard(1, []), new Set(), mulberry32(1))).toBeNull();
    expect(planSpin(layoutBoard(1, items(5)), new Set(), mulberry32(1))).toBeNull();
    expect(planSpin(layoutBoard(1, items(5)), new Set(['nope']), mulberry32(1))).toBeNull();
  });

  it('works with a single flower', () => {
    const { plan } = check(1, ['f0'], 1);
    expect(plan.hops).toHaveLength(1);
  });

  it('works with 2 flowers across many seeds', () => {
    for (let s = 1; s <= 300; s++) check(2, ['f0', 'f1'], s);
  });

  it('works when only one of many flowers is eligible', () => {
    for (let s = 1; s <= 100; s++) {
      const { plan } = check(8, ['f3'], s);
      expect(plan.winnerFlowerId).toBe('f3');
    }
  });

  it('holds its invariants across many boards and seeds', () => {
    for (let s = 1; s <= 300; s++) {
      const n = 3 + (s % 25);
      check(
        n,
        ids(n).filter((_, i) => i % 3 !== 0 || n < 4),
        s,
      );
    }
  });

  it('has 15–20 random hops, then sometimes a fake-out next to the winner, then the winner', () => {
    let withFake = 0;
    for (let s = 1; s <= 100; s++) {
      const { layout, plan } = check(12, ids(12), s);
      const random = plan.hops.filter((h) => h.kind === 'hop');
      expect(random.length).toBeGreaterThanOrEqual(SPIN.minHops);
      expect(random.length).toBeLessThanOrEqual(SPIN.maxHops);
      const fake = plan.hops.filter((h) => h.kind === 'fakeout');
      if (fake.length) {
        withFake++;
        expect(fake).toHaveLength(1);
        expect(plan.hops[plan.hops.length - 2].kind).toBe('fakeout');
        const w = layout.cells[plan.winnerCellIndex];
        const f = layout.cells[fake[0].cellIndex];
        const dist = Math.abs(w.col - f.col) + Math.abs(w.row - f.row);
        expect(dist).toBeLessThanOrEqual(2);
        expect(plan.hops[plan.hops.length - 1].delayMs).toBe(SPIN.fakeoutPauseMs);
      }
    }
    // random, not always: roughly half the spins
    expect(withFake).toBeGreaterThan(25);
    expect(withFake).toBeLessThan(75);
  });

  it('slows down: gaps follow 70 + 520 (k/n)^2.4', () => {
    expect(hopGap(0, 16)).toBe(70);
    expect(hopGap(16, 16)).toBeCloseTo(590);
    const { plan } = check(12, ids(12), 4);
    const delays = plan.hops.filter((h) => h.kind === 'hop').map((h) => h.delayMs);
    for (let i = 2; i < delays.length; i++) expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
    expect(planDurationMs(plan)).toBeGreaterThan(3000);
    expect(planDurationMs(plan)).toBeLessThan(10000);
  });

  it('winner is roughly uniform', () => {
    const layout = layoutBoard(3, items(4));
    const counts: Record<string, number> = {};
    const rng = mulberry32(77);
    for (let i = 0; i < 4000; i++) {
      const p = planSpin(layout, new Set(ids(4)), rng)!;
      counts[p.winnerFlowerId] = (counts[p.winnerFlowerId] ?? 0) + 1;
    }
    for (const id of ids(4)) expect(counts[id]).toBeGreaterThan(850);
  });
});
