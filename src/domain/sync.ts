// Todoist sync (docs/PLAN.md §6 "Sync"). Adds new Todoist tasks, drops Todoist tasks Todoist no
// longer returns as today/overdue (completed, deleted or rescheduled). Never touches Hive flowers.

import type { Flower } from './types';

export interface MergeResult {
  flowers: Flower[];
  /** Incoming Todoist flowers that weren't on the board */
  added: number;
  /** Todoist flowers on the board that Todoist no longer returns (removed) */
  gone: number;
}

export function mergeTodoist(current: readonly Flower[], incoming: readonly Flower[]): MergeResult {
  const incomingById = new Map(
    incoming.filter((f) => f.source === 'todoist').map((f) => [f.id, f]),
  );
  const currentIds = new Set(current.map((f) => f.id));
  let gone = 0;

  const flowers: Flower[] = [];
  for (const f of current) {
    if (f.source !== 'todoist') {
      flowers.push(f);
      continue;
    }
    const fresh = incomingById.get(f.id);
    if (!fresh) {
      gone++;
      continue;
    }
    const { goneFromTodoist: _wasGone, daysLate: _oldLate, ...rest } = f;
    flowers.push({
      ...rest,
      title: fresh.title,
      projectKey: fresh.projectKey,
      projectName: fresh.projectName,
      color: fresh.color,
      ...(fresh.daysLate ? { daysLate: fresh.daysLate } : {}),
    });
  }

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
