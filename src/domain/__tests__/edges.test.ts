import { projectEdges } from '../edges';
import { type BoardLayout, coordKey, neighbour, oppositeDirection } from '../hexLayout';

const flower = (projectKey: string, color: string) => ({ projectKey, color });

describe('projectEdges', () => {
  it('a lone cell gets all six sides', () => {
    const layout: BoardLayout = { cells: [{ col: 0, row: 0, flowerId: 'a' }] };
    const edges = projectEdges(layout, new Map([['a', flower('p', '#111111')]]));
    expect(edges.map((e) => e.dir).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(edges.every((e) => e.color === '#111111')).toBe(true);
  });

  it('same-project neighbours share no border; different projects both draw theirs', () => {
    // (0,0) and (1,0) are neighbours via direction 0
    const layout: BoardLayout = {
      cells: [
        { col: 0, row: 0, flowerId: 'a' },
        { col: 1, row: 0, flowerId: 'b' },
      ],
    };
    const same = projectEdges(
      layout,
      new Map([
        ['a', flower('p', '#aaaaaa')],
        ['b', flower('p', '#aaaaaa')],
      ]),
    );
    expect(same).toHaveLength(10);
    expect(same.find((e) => e.cellIndex === 0 && e.dir === 0)).toBeUndefined();
    expect(same.find((e) => e.cellIndex === 1 && e.dir === 3)).toBeUndefined();

    const diff = projectEdges(
      layout,
      new Map([
        ['a', flower('p', '#aaaaaa')],
        ['b', flower('q', '#bbbbbb')],
      ]),
    );
    expect(diff).toHaveLength(12);
    expect(diff.find((e) => e.cellIndex === 0 && e.dir === 0)?.color).toBe('#aaaaaa');
    expect(diff.find((e) => e.cellIndex === 1 && e.dir === 3)?.color).toBe('#bbbbbb');
  });

  it('every border faces an empty cell or another project', () => {
    const cells = [
      { col: 0, row: 0, flowerId: 'a' },
      { col: 1, row: 0, flowerId: 'b' },
      { col: 0, row: 1, flowerId: 'c' },
      { col: -1, row: 0, flowerId: 'd' },
    ];
    const projects: Record<string, string> = { a: 'p', b: 'p', c: 'q', d: 'p' };
    const layout: BoardLayout = { cells };
    const fm = new Map(cells.map((c) => [c.flowerId, flower(projects[c.flowerId], '#fff')]));
    const byKey = new Map(cells.map((c) => [coordKey(c), c]));
    for (const e of projectEdges(layout, fm)) {
      const nb = byKey.get(coordKey(neighbour(cells[e.cellIndex], e.dir)));
      if (nb) expect(projects[nb.flowerId]).not.toBe(projects[cells[e.cellIndex].flowerId]);
    }
    // c (q) touches a (p): both sides drawn
    const ia = 0;
    const ic = 2;
    const dirAC = [0, 1, 2, 3, 4, 5].find(
      (d) => coordKey(neighbour(cells[ia], d as 0)) === coordKey(cells[ic]),
    ) as 0;
    const edges = projectEdges(layout, fm);
    expect(edges.some((e) => e.cellIndex === ia && e.dir === dirAC)).toBe(true);
    expect(edges.some((e) => e.cellIndex === ic && e.dir === oppositeDirection(dirAC))).toBe(true);
  });
});
