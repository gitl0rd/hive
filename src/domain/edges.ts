// Project territory borders (docs/PLAN.md §6 "Edges").

import {
  type BoardLayout,
  coordKey,
  DIRECTIONS,
  type Direction,
  indexByCoord,
  neighbour,
} from './hexLayout';
import type { Flower } from './types';

export interface Edge {
  cellIndex: number;
  dir: Direction;
  /** The cell's project colour */
  color: string;
}

/**
 * A cell gets a border on a side when the neighbour there is empty or belongs to a different
 * project. Same-project neighbours share no border, so projects form territories. Where two
 * projects meet, both cells draw their own side (each in its own colour).
 */
export function projectEdges(
  layout: BoardLayout,
  flowersById: ReadonlyMap<string, Pick<Flower, 'projectKey' | 'color'>>,
): Edge[] {
  const byCoord = indexByCoord(layout);
  const edges: Edge[] = [];
  layout.cells.forEach((cell, cellIndex) => {
    const flower = flowersById.get(cell.flowerId);
    if (!flower) return;
    for (const dir of DIRECTIONS) {
      const nbIndex = byCoord.get(coordKey(neighbour(cell, dir)));
      const nb =
        nbIndex === undefined ? undefined : flowersById.get(layout.cells[nbIndex].flowerId);
      if (!nb || nb.projectKey !== flower.projectKey) {
        edges.push({ cellIndex, dir, color: flower.color });
      }
    }
  });
  return edges;
}
