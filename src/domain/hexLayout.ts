// Pointy-top hex board in odd-row offset coordinates (odd rows shifted right by half a cell).
// See docs/PLAN.md §6 "Board".

import { mulberry32, shuffle, weightedIndex } from './random';

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

/**
 * Lay out one cell per flower as a compact blob.
 *
 * Start at (0,0); repeatedly add a frontier cell with weight = (filled neighbours)^3. Then shuffle
 * which flower goes in which cell. All randomness comes from `seed`, so the same seed + same flower
 * set always gives the same board. Flower order doesn't matter (ids are sorted first).
 *
 * Full re-layout by design: adding/removing a flower can move every cell.
 */
export function layoutBoard(seed: number, flowerIds: readonly string[]): BoardLayout {
  const n = flowerIds.length;
  if (n === 0) return { cells: [] };
  const rng = mulberry32(seed);

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

  const ids = shuffle(rng, [...flowerIds].sort());
  return { cells: filled.map((c, i) => ({ ...c, flowerId: ids[i] })) };
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
