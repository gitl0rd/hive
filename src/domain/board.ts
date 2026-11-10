// Board-level selectors shared by the UI. Pure.

import type { LayoutItem } from './hexLayout';
import type { Flower } from './types';

/** Flowers the bee may land on: not excluded today and still in Todoist. */
export function eligibleIds(flowers: readonly Flower[], excluded: Iterable<string>): Set<string> {
  const ex = new Set(excluded);
  return new Set(flowers.filter((f) => !ex.has(f.id) && !f.goneFromTodoist).map((f) => f.id));
}

export interface BoardCounts {
  /** FLWR: eligible flowers */
  flowers: number;
  /** LATE: eligible flowers that are overdue */
  late: number;
}

export function boardCounts(flowers: readonly Flower[], excluded: Iterable<string>): BoardCounts {
  const elig = eligibleIds(flowers, excluded);
  return {
    flowers: elig.size,
    late: flowers.filter((f) => elig.has(f.id) && (f.daysLate ?? 0) > 0).length,
  };
}

/** Layout input: one item per flower, grouped by project so projects form territories. */
export function layoutItems(flowers: readonly Flower[]): LayoutItem[] {
  return flowers.map((f) => ({ id: f.id, group: f.projectKey }));
}
