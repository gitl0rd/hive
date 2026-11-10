// Pointy-top hex board in odd-row offset coordinates (odd rows shifted right by half a cell).
// See docs/PLAN.md §6 "Board".

import { mulberry32, pick, type Rng, shuffle, weightedIndex } from './random';

export interface Coord {
  col: number;
  row: number;
}

export interface Cell extends Coord {
  flowerId: string;
}

export interface BoardLayout {
  /** One cell per flower. Index in this array = cell index used by edges and spin plans. */
  cells: Cell[];
}

/**
 * The six directions, in the order the plan lists them.
 * Angles are screen angles (y points down), so -60° is up-right.
 */
export const DIRECTION_ANGLES = [0, -60, -120, 180, 120, 60] as const;
export type Direction = 0 | 1 | 2 | 3 | 4 | 5;
export const DIRECTIONS: readonly Direction[] = [0, 1, 2, 3, 4, 5];

const EVEN_ROW_OFFSETS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];
const ODD_ROW_OFFSETS: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [0, 1],
  [1, 1],
];

export function isOddRow(row: number): boolean {
  return (row & 1) === 1; // works for negative rows too
}

export function neighbour(c: Coord, dir: Direction): Coord {
  const [dc, dr] = (isOddRow(c.row) ? ODD_ROW_OFFSETS : EVEN_ROW_OFFSETS)[dir];
  return { col: c.col + dc, row: c.row + dr };
}

export function neighbours(c: Coord): Coord[] {
  return DIRECTIONS.map((d) => neighbour(c, d));
}

export function oppositeDirection(dir: Direction): Direction {
  return ((dir + 3) % 6) as Direction;
}

export function coordKey(c: Coord): string {
  return `${c.col},${c.row}`;
}

export interface LayoutItem {
  id: string;
  /** Items with the same group (project) are placed in touching cells. */
  group: string;
}

/**
 * Lay out one cell per flower as a compact blob, with each project forming a territory.
 *
 * 1. Grow the blob: start at (0,0); repeatedly add a frontier cell with weight =
 *    (filled neighbours)^3.
 * 2. Carve it into territories, biggest project first: start in an unclaimed cell with the fewest
 *    unclaimed neighbours (an edge/corner, so we don't split the remaining space), then grow by
 *    adding unclaimed cells touching the territory, weighted by (territory neighbours)^3. If a
 *    territory gets boxed in it continues from a new start (rare; it just ends up in two pieces).
 * 3. Shuffle flowers within their territory.
 *
 * All randomness comes from `seed`, so the same seed + same items always give the same board.
 * Item order doesn't matter. Full re-layout by design: any change can move every cell.
 */
export function layoutBoard(seed: number, items: readonly LayoutItem[]): BoardLayout {
  const n = items.length;
  if (n === 0) return { cells: [] };
  const rng = mulberry32(seed);
  const cells = growBlob(rng, n);
  const keyToIndex = new Map(cells.map((c, i) => [coordKey(c), i]));
  const nbIdx = cells.map((c) =>
    neighbours(c)
      .map((nb) => keyToIndex.get(coordKey(nb)))
      .filter((i): i is number => i !== undefined),
  );

  // Groups: biggest first; ties broken by a seeded shuffle of the sorted names.
  const byGroup = new Map<string, string[]>();
  for (const it of [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    const list = byGroup.get(it.group) ?? [];
    list.push(it.id);
    byGroup.set(it.group, list);
  }
  const groups = shuffle(rng, [...byGroup.keys()].sort()).sort(
    (a, b) => byGroup.get(b)!.length - byGroup.get(a)!.length,
  );

  const owner: (string | null)[] = cells.map(() => null);
  const free = (i: number) => owner[i] === null;
  const freeNeighbours = (i: number) => nbIdx[i].filter(free).length;

  const pickStart = (): number => {
    let best: number[] = [];
    let bestScore = Infinity;
    owner.forEach((o, i) => {
      if (o !== null) return;
      const score = freeNeighbours(i);
      if (score < bestScore) {
        bestScore = score;
        best = [i];
      } else if (score === bestScore) best.push(i);
    });
    return pick(rng, best);
  };

  const assignment: string[] = cells.map(() => '');
  for (const g of groups) {
    const ids = shuffle(rng, byGroup.get(g)!);
    const territory: number[] = [];
    while (territory.length < ids.length) {
      const frontier: number[] = [];
      const weights: number[] = [];
      for (const t of territory) {
        for (const nb of nbIdx[t]) {
          if (!free(nb) || frontier.includes(nb)) continue;
          frontier.push(nb);
          weights.push(nbIdx[nb].filter((x) => owner[x] === g).length ** 3);
        }
      }
      const next = frontier.length > 0 ? frontier[weightedIndex(rng, weights)] : pickStart();
      owner[next] = g;
      territory.push(next);
    }
    territory.forEach((cellIndex, k) => (assignment[cellIndex] = ids[k]));
  }

  return { cells: cells.map((c, i) => ({ ...c, flowerId: assignment[i] })) };
}

function growBlob(rng: Rng, n: number): Coord[] {
  const filled: Coord[] = [{ col: 0, row: 0 }];
  const filledKeys = new Set([coordKey(filled[0])]);
  while (filled.length < n) {
    // Frontier in deterministic order: filled cells in insertion order, neighbours in direction order.
    const frontier: Coord[] = [];
    const weights: number[] = [];
    const seen = new Set<string>();
    for (const f of filled) {
      for (const nb of neighbours(f)) {
        const k = coordKey(nb);
        if (filledKeys.has(k) || seen.has(k)) continue;
        seen.add(k);
        const count = neighbours(nb).filter((x) => filledKeys.has(coordKey(x))).length;
        frontier.push(nb);
        weights.push(count ** 3);
      }
    }
    const next = frontier[weightedIndex(rng, weights)];
    filled.push(next);
    filledKeys.add(coordKey(next));
  }
  return filled;
}

/** Map coordKey -> cell index, for neighbour lookups. */
export function indexByCoord(layout: BoardLayout): Map<string, number> {
  return new Map(layout.cells.map((c, i) => [coordKey(c), i]));
}

/** Indices of occupied neighbouring cells. */
export function occupiedNeighbourIndices(layout: BoardLayout, cellIndex: number): number[] {
  const byCoord = indexByCoord(layout);
  const out: number[] = [];
  for (const nb of neighbours(layout.cells[cellIndex])) {
    const i = byCoord.get(coordKey(nb));
    if (i !== undefined) out.push(i);
  }
  return out;
}

// ---- Geometry (board units; the UI scales the whole board to fit) ----

export interface Point {
  x: number;
  y: number;
}

/** Circumradius for a given cell width (flat-to-flat for pointy-top). */
export function radiusForWidth(cellWidth: number): number {
  return cellWidth / Math.sqrt(3);
}

export function cellCenter(c: Coord, cellWidth: number): Point {
  const r = radiusForWidth(cellWidth);
  return {
    x: c.col * cellWidth + (isOddRow(c.row) ? cellWidth / 2 : 0),
    y: c.row * 1.5 * r,
  };
}

/** Six corners, starting at the top and going clockwise (screen coords). */
export function hexCorners(center: Point, cellWidth: number): Point[] {
  const r = radiusForWidth(cellWidth);
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
  });
}

/** The side of a cell that faces `dir`: the segment between corners at angle±30°. */
export function sideSegment(center: Point, cellWidth: number, dir: Direction): [Point, Point] {
  const r = radiusForWidth(cellWidth);
  const angle = DIRECTION_ANGLES[dir];
  const at = (deg: number): Point => ({
    x: center.x + r * Math.cos((deg * Math.PI) / 180),
    y: center.y + r * Math.sin((deg * Math.PI) / 180),
  });
  return [at(angle - 30), at(angle + 30)];
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/** Bounding box of all hexes (including their outlines' geometry, not stroke width). */
export function boardBounds(layout: BoardLayout, cellWidth: number): Bounds {
  if (layout.cells.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  const r = radiusForWidth(cellWidth);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of layout.cells) {
    const p = cellCenter(c, cellWidth);
    minX = Math.min(minX, p.x - cellWidth / 2);
    maxX = Math.max(maxX, p.x + cellWidth / 2);
    minY = Math.min(minY, p.y - r);
    maxY = Math.max(maxY, p.y + r);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Scale to fit an area: shrink if needed, never enlarge. */
export function fitScale(bounds: Bounds, areaWidth: number, areaHeight: number): number {
  if (bounds.width === 0 || bounds.height === 0) return 1;
  return Math.min(1, areaWidth / bounds.width, areaHeight / bounds.height);
}
