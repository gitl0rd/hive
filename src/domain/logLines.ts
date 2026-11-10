// Flight log line formats (docs/PLAN.md §6). Pure.

import { hhmm } from './dates';

export const LOG_CAP = 200;

export const log = {
  boot: () => 'HIVE.EXE v2.0',
  dispatch: (now: Date) => `${hhmm(now)} > dispatch bee`,
  hop: (n: number, title: string) =>
    `      hop ${String(n).padStart(2, '0')}  ${title.toLowerCase()}`,
  landed: (now: Date, title: string, project: string) =>
    `${hhmm(now)} > LANDED: ${title.toUpperCase()} [${project.toUpperCase()}]`,
  removed: (now: Date, title: string) => `${hhmm(now)} > rm ${title.toLowerCase()} --today`,
  done: (now: Date, title: string) => `${hhmm(now)} > done ${title.toLowerCase()}`,
  nothingToSpin: (now: Date) => `${hhmm(now)} > no flowers to spin`,
  sync: (now: Date, added: number, hiveKept: number) =>
    `${hhmm(now)} > sync todoist ... +${added} new, ${hiveKept} hive kept`,
  added: (now: Date, title: string) => `${hhmm(now)} > add "${title.toLowerCase()}" ... ok`,
  deleted: (now: Date, title: string) => `${hhmm(now)} > del "${title.toLowerCase()}"`,
  shuffled: (now: Date) => `${hhmm(now)} > shuffle comb ... ok`,
  loadHive: (now: Date, count: number) => `${hhmm(now)} > load hive ...... ok (${count})`,
  overdue: (now: Date, count: number) =>
    `${hhmm(now)} > ${count} flower${count === 1 ? '' : 's'} overdue`,
  ready: (now: Date) => `${hhmm(now)} > ready.`,
  reset: (now: Date, wasFlying: boolean) =>
    `${hhmm(now)} > ${wasFlying ? 'recall bee ... flight aborted' : 'reset comb ... bee home'}`,
  badTokenHint: () => '      fix: CFG > REPLACE TOKEN',
  syncFailed: (now: Date, reason: string) =>
    `${hhmm(now)} > sync todoist ... FAILED (${reason}), kept last data`,
};

/** Append lines, keeping only the newest LOG_CAP. */
export function appendLog(lines: readonly string[], ...add: string[]): string[] {
  const next = lines.concat(add);
  return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
}
