import { coinPose, MIN_SQUASH, otherSide, planFlip, restingPose, tally } from '../coin';
import { mulberry32 } from '../random';

describe('planFlip', () => {
  it('half-turn parity lands on the planned side', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const from = i % 2 ? 'heads' : 'tails';
      const plan = planFlip(rng, from);
      expect(plan.halfTurns % 2 === 0).toBe(plan.side === from);
      expect(plan.halfTurns).toBeGreaterThanOrEqual(10);
      expect(plan.halfTurns).toBeLessThanOrEqual(13);
    }
  });

  it('is roughly fair', () => {
    const rng = mulberry32(42);
    const sides = Array.from({ length: 2000 }, () => planFlip(rng).side);
    const { heads } = tally(sides);
    expect(heads).toBeGreaterThan(900);
    expect(heads).toBeLessThan(1100);
  });
});

describe('coinPose', () => {
  const plan = { from: 'heads' as const, side: 'tails' as const, halfTurns: 11, durationMs: 1000 };

  it('starts flat on the table showing `from`', () => {
    const p = coinPose(plan, 0);
    expect(p).toMatchObject({ angle: 0, lift: 0, face: 'heads', squash: 1, done: false });
  });

  it('lands flat, at rest, on the planned side', () => {
    for (const t of [1000, 1500]) {
      const p = coinPose(plan, t);
      expect(p.done).toBe(true);
      expect(p.lift).toBe(0);
      expect(p.face).toBe('tails');
      expect(p.squash).toBeCloseTo(1);
    }
  });

  it('rises then falls, peaking mid-flip', () => {
    expect(coinPose(plan, 500).lift).toBeCloseTo(1);
    expect(coinPose(plan, 250).lift).toBeGreaterThan(0.5);
    expect(coinPose(plan, 250).lift).toBeLessThan(1);
  });

  it('spins fast first, then slows (angle never goes backwards)', () => {
    let prev = -1;
    const steps: number[] = [];
    for (let t = 0; t <= 1000; t += 50) {
      const a = coinPose(plan, t).angle;
      expect(a).toBeGreaterThanOrEqual(prev);
      steps.push(a - prev);
      prev = a;
    }
    expect(steps[2]).toBeGreaterThan(steps[steps.length - 1]);
  });

  it('face swaps each time the coin passes edge-on, and never draws thinner than the rim', () => {
    let faces = 0;
    let last = 'heads';
    for (let t = 0; t <= 1000; t += 2) {
      const p = coinPose(plan, t);
      expect(p.squash).toBeGreaterThanOrEqual(MIN_SQUASH);
      if (p.face !== last) faces++;
      last = p.face;
    }
    expect(faces).toBe(11);
  });

  it('even half turns land on the starting side', () => {
    const p = coinPose({ ...plan, side: 'heads', halfTurns: 10 }, 1000);
    expect(p.face).toBe('heads');
  });
});

describe('helpers', () => {
  it('otherSide, restingPose, tally', () => {
    expect(otherSide('heads')).toBe('tails');
    expect(otherSide('tails')).toBe('heads');
    expect(restingPose('tails')).toMatchObject({ face: 'tails', squash: 1, lift: 0, done: true });
    expect(tally(['heads', 'tails', 'tails'])).toEqual({ heads: 1, tails: 2 });
    expect(tally([])).toEqual({ heads: 0, tails: 0 });
  });
});
