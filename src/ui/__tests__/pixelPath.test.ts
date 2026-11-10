import { pixelatePath, samplePath } from '../pixelPath';

describe('pixelPath', () => {
  it('samples lines and curves end to end', () => {
    const pts = samplePath('M0 0 L10 0');
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 10, y: 0 });
    const c = samplePath('M0 0 C 0 10, 10 10, 10 0 S 20 -10, 20 0');
    expect(c[c.length - 1]).toEqual({ x: 20, y: 0 });
    expect(Math.max(...c.map((p) => p.y))).toBeGreaterThan(5); // bulges like the curve
  });

  it('snaps to unique grid cells and wraps at the tile edge', () => {
    const cells = pixelatePath('M0 2 L40 2', 40, 8, 4);
    expect(cells).toEqual(Array.from({ length: 10 }, (_, c) => [c, 0])); // x=40 wraps to col 0
  });
});
