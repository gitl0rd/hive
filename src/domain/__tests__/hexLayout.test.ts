import {
  boardBounds,
  cellCenter,
  coordKey,
  DIRECTIONS,
  fitScale,
  layoutBoard,
  neighbour,
  neighbours,
  oppositeDirection,
  radiusForWidth,
  sideSegment,
} from '../hexLayout';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `f${i}`);

describe('neighbours', () => {
  it('matches the plan table for even rows', () => {
    expect(neighbours({ col: 2, row: 2 }).map(coordKey)).toEqual([
      '3,2',
      '2,1',
      '1,1',
      '1,2',
      '1,3',
      '2,3',
    ]);
  });

  it('matches the plan table for odd rows (incl. negative)', () => {
    expect(neighbours({ col: 2, row: 1 }).map(coordKey)).toEqual([
      '3,1',
      '3,0',
      '2,0',
      '1,1',
      '2,2',
      '3,2',
    ]);
    expect(neighbours({ col: 0, row: -1 }).map(coordKey)).toEqual([
      '1,-1',
      '1,-2',
      '0,-2',
      '-1,-1',
      '0,0',
      '1,0',
    ]);
  });

  it('is symmetric: going dir then opposite returns home', () => {
    for (const row of [-3, -2, -1, 0, 1, 2]) {
      for (const dir of DIRECTIONS) {
        const start = { col: 1, row };
        expect(neighbour(neighbour(start, dir), oppositeDirection(dir))).toEqual(start);
      }
    }
  });

  it('neighbour centres are one cell width apart in the right direction', () => {
    const w = 100;
    for (const row of [0, 1]) {
      const c = { col: 0, row };
      const p = cellCenter(c, w);
      const angles = [0, -60, -120, 180, 120, 60];
      DIRECTIONS.forEach((dir, i) => {
        const q = cellCenter(neighbour(c, dir), w);
        const dist = Math.hypot(q.x - p.x, q.y - p.y);
        expect(dist).toBeCloseTo(w, 6);
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        expect(((ang - angles[i] + 540) % 360) - 180).toBeCloseTo(0, 6);
      });
    }
  });
});

describe('layoutBoard', () => {
  it('handles 0 and 1 flowers', () => {
    expect(layoutBoard(1, []).cells).toEqual([]);
    expect(layoutBoard(1, ['a']).cells).toEqual([{ col: 0, row: 0, flowerId: 'a' }]);
  });

  it('places every flower exactly once in distinct cells', () => {
    for (const n of [2, 7, 20, 45]) {
      const { cells } = layoutBoard(123, ids(n));
      expect(cells).toHaveLength(n);
      expect(new Set(cells.map((c) => c.flowerId)).size).toBe(n);
      expect(new Set(cells.map(coordKey)).size).toBe(n);
    }
  });

  it('is connected (a single blob)', () => {
    const { cells } = layoutBoard(99, ids(30));
    const keys = new Set(cells.map(coordKey));
    const seen = new Set([coordKey(cells[0])]);
    const stack = [cells[0]];
    while (stack.length) {
      const c = stack.pop()!;
      for (const nb of neighbours(c)) {
        const k = coordKey(nb);
        if (keys.has(k) && !seen.has(k)) {
          seen.add(k);
          stack.push({ ...nb, flowerId: '' });
        }
      }
    }
    expect(seen.size).toBe(30);
  });

  it('is deterministic for a seed and independent of input order', () => {
    const a = layoutBoard(5, ['x', 'y', 'z', 'w']);
    const b = layoutBoard(5, ['w', 'z', 'y', 'x']);
    expect(a).toEqual(b);
  });

  it('different seeds give different boards', () => {
    expect(layoutBoard(1, ids(12))).not.toEqual(layoutBoard(2, ids(12)));
  });

  it('is compact: most cells have several filled neighbours', () => {
    const { cells } = layoutBoard(11, ids(19));
    const keys = new Set(cells.map(coordKey));
    const avg =
      cells.reduce((s, c) => s + neighbours(c).filter((n) => keys.has(coordKey(n))).length, 0) /
      cells.length;
    expect(avg).toBeGreaterThan(3);
  });
});

describe('geometry', () => {
  it('side segments are shared exactly by neighbouring cells', () => {
    const w = 112;
    const a = { col: 0, row: 1 };
    for (const dir of DIRECTIONS) {
      const [p1, p2] = sideSegment(cellCenter(a, w), w, dir);
      const b = neighbour(a, dir);
      const [q1, q2] = sideSegment(cellCenter(b, w), w, oppositeDirection(dir));
      // same segment, reversed
      expect(p1.x).toBeCloseTo(q2.x, 6);
      expect(p1.y).toBeCloseTo(q2.y, 6);
      expect(p2.x).toBeCloseTo(q1.x, 6);
      expect(p2.y).toBeCloseTo(q1.y, 6);
    }
  });

  it('bounds and fitScale never scale up', () => {
    const w = 150;
    const one = boardBounds(layoutBoard(1, ['a']), w);
    expect(one.width).toBeCloseTo(w);
    expect(one.height).toBeCloseTo(2 * radiusForWidth(w));
    expect(fitScale(one, 1000, 1000)).toBe(1);
    const many = boardBounds(layoutBoard(1, ids(40)), w);
    const s = fitScale(many, 330, 330);
    expect(s).toBeLessThan(1);
    expect(many.width * s).toBeLessThanOrEqual(330 + 1e-9);
    expect(many.height * s).toBeLessThanOrEqual(330 + 1e-9);
  });
});
