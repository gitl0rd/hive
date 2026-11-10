// Add-only Todoist sync (docs/PLAN.md §6 "Sync"). Never removes anything; never touches Hive flowers.

import type { Flower } from './types';

export interface MergeResult {
  flowers: Flower[];
  /** Incoming Todoist flowers that weren't on the board */
  added: number;
  /** Todoist flowers on the board that Todoist no longer returns (now marked gone) */
  gone: number;
}

export function mergeTodoist(current: readonly Flower[], incoming: readonly Flower[]): MergeResult {
  const incomingById = new Map(
    incoming.filter((f) => f.source === 'todoist').map((f) => [f.id, f]),
  );
  const currentIds = new Set(current.map((f) => f.id));
  let gone = 0;

  const flowers = current.map((f): Flower => {
    if (f.source !== 'todoist') return f;
    const fresh = incomingById.get(f.id);
    if (!fresh) {
      gone++;
      return f.goneFromTodoist ? f : { ...f, goneFromTodoist: true };
    }
    const { goneFromTodoist: _wasGone, daysLate: _oldLate, ...rest } = f;
    return {
      ...rest,
      title: fresh.title,
      projectKey: fresh.projectKey,
      projectName: fresh.projectName,
      color: fresh.color,
      ...(fresh.daysLate ? { daysLate: fresh.daysLate } : {}),
    };
  });

  let added = 0;
  for (const f of incomingById.values()) {
    if (!currentIds.has(f.id)) {
      const { goneFromTodoist: _ignored, ...clean } = f;
      flowers.push(clean);
      added++;
    }
  }
  return { flowers, added, gone };
}
