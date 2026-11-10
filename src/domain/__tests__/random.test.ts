import { mulberry32, randInt, shuffle, weightedIndex } from '../random';

describe('random', () => {
  it('mulberry32 is deterministic and in [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('randInt stays in range inclusive', () => {
    const rng = mulberry32(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(randInt(rng, 15, 20));
    expect([...seen].sort()).toEqual([15, 16, 17, 18, 19, 20]);
  });

  it('weightedIndex never picks zero-weight entries', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 1000; i++) expect(weightedIndex(rng, [0, 5, 0, 1])).not.toBe(0);
    expect(() => weightedIndex(rng, [0, 0])).toThrow();
  });

  it('shuffle is a permutation and does not mutate', () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = shuffle(mulberry32(9), src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(src);
  });
});
