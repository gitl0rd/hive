import type { Flower } from '../../domain/types';
import {
  boardFlowers,
  hiveReducer,
  type HiveState,
  HISTORY_CAP,
  initialHiveState,
} from '../hiveReducer';

const now = new Date(2026, 10, 10, 9, 30);
const today = '2026-11-10';
const td = (id: string, extra: Partial<Flower> = {}): Flower => ({
  id: `todoist:${id}`,
  source: 'todoist',
  title: `task ${id}`,
  projectKey: 'p',
  projectName: 'Inbox',
  color: '#999999',
  ...extra,
});

function withTasks(): HiveState {
  let s = initialHiveState(today, 1);
  s = hiveReducer(s, { type: 'addTask', id: 'a', title: 'Gym', now });
  s = hiveReducer(s, { type: 'addTask', id: 'b', title: 'Read', now });
  s = hiveReducer(s, { type: 'synced', incoming: [td('1', { daysLate: 2 }), td('2')], now });
  return s;
}

describe('hiveReducer', () => {
  it('adds Hive tasks that show on the board, logged', () => {
    const s = withTasks();
    expect(s.tasks.map((t) => t.title)).toEqual(['Gym', 'Read']);
    expect(boardFlowers(s).map((f) => f.id)).toEqual([
      'todoist:1',
      'todoist:2',
      'hive:a',
      'hive:b',
    ]);
    expect(s.day.log).toContain('09:30 > add "gym" ... ok');
  });

  it('deletes Hive tasks only, and clears their exclusion', () => {
    let s = withTasks();
    s = hiveReducer(s, { type: 'toggle', id: 'hive:a' });
    s = hiveReducer(s, { type: 'deleteTask', flowerId: 'hive:a', now });
    expect(s.tasks.map((t) => t.id)).toEqual(['b']);
    expect(s.day.excluded).toEqual([]);
    expect(hiveReducer(s, { type: 'deleteTask', flowerId: 'todoist:1', now })).toBe(s);
  });

  it('DONE sets doneAt, counts, excludes; Todoist tasks are untouched', () => {
    let s = withTasks();
    s = hiveReducer(s, { type: 'done', id: 'hive:a', now });
    expect(s.tasks[0].doneAt).toBe(now.toISOString());
    expect(s.day.hiveDone).toBe(1);
    expect(s.day.excluded).toEqual(['hive:a']);
    expect(hiveReducer(s, { type: 'done', id: 'todoist:1', now })).toBe(s);
  });

  it('a new day resets the day but keeps undone Hive tasks and history', () => {
    let s = withTasks();
    s = hiveReducer(s, { type: 'done', id: 'hive:a', now });
    s = hiveReducer(s, { type: 'landed', id: 'todoist:1', now });
    s = hiveReducer(s, { type: 'newDay', date: '2026-11-11', seed: 9 });
    expect(s.day.date).toBe('2026-11-11');
    expect(s.day.todoistFlowers).toEqual([]);
    expect(s.day.excluded).toEqual([]);
    expect(s.day.hiveDone).toBe(0);
    expect(s.day.seed).toBe(9);
    expect(s.history).toHaveLength(1);
    // 'Gym' was done yesterday -> gone; 'Read' carries over
    expect(boardFlowers(s).map((f) => f.id)).toEqual(['hive:b']);
  });

  it('sync is add-only, logs, and never touches Hive tasks', () => {
    let s = withTasks();
    const tasksBefore = s.tasks;
    s = hiveReducer(s, { type: 'synced', incoming: [td('2'), td('3')], todoistDone: 4, now });
    expect(s.tasks).toBe(tasksBefore);
    expect(s.day.todoistFlowers.map((f) => [f.id, !!f.goneFromTodoist])).toEqual([
      ['todoist:1', true],
      ['todoist:2', false],
      ['todoist:3', false],
    ]);
    expect(s.day.todoistDone).toBe(4);
    expect(s.day.log[s.day.log.length - 1]).toBe('09:30 > sync todoist ... +1 new, 2 hive kept');
  });

  it('boot sync adds the startup lines', () => {
    let s = initialHiveState(today, 1);
    s = hiveReducer(s, {
      type: 'synced',
      incoming: [td('1', { daysLate: 2 })],
      now,
      boot: true,
    });
    expect(s.day.log.slice(-4)).toEqual([
      '09:30 > sync todoist ... +1 new, 0 hive kept',
      '09:30 > load hive ...... ok (0)',
      '09:30 > 1 flower overdue',
      '09:30 > ready.',
    ]);
  });

  it('a failed sync keeps the last data and logs', () => {
    const s = withTasks();
    const t = hiveReducer(s, { type: 'syncFailed', reason: 'offline', now });
    expect(t.day.todoistFlowers).toBe(s.day.todoistFlowers);
    expect(t.day.log[t.day.log.length - 1]).toBe(
      '09:30 > sync todoist ... FAILED (offline), kept last data',
    );
  });

  it('a rejected token adds a hint to replace it', () => {
    const t = hiveReducer(withTasks(), { type: 'syncFailed', reason: 'bad token', now });
    expect(t.day.log.slice(-2)).toEqual([
      '09:30 > sync todoist ... FAILED (bad token), kept last data',
      '      fix: settings cog > REPLACE TOKEN',
    ]);
  });

  it('shuffle changes the seed only', () => {
    const s = withTasks();
    const t = hiveReducer(s, { type: 'shuffle', seed: 77, now });
    expect(t.day.seed).toBe(77);
    expect(t.day.todoistFlowers).toBe(s.day.todoistFlowers);
  });

  it('REMOVE and landing', () => {
    let s = withTasks();
    s = hiveReducer(s, { type: 'remove', id: 'todoist:1', now });
    expect(s.day.excluded).toEqual(['todoist:1']);
    s = hiveReducer(s, { type: 'landed', id: 'hive:b', now });
    expect(s.history[0]).toMatchObject({ flowerId: 'hive:b', title: 'Read', projectName: 'Hive' });
    for (let i = 0; i < HISTORY_CAP + 3; i++) {
      s = hiveReducer(s, { type: 'landed', id: 'hive:b', now });
    }
    expect(s.history).toHaveLength(HISTORY_CAP);
  });

  it('deletes one history entry, leaving the rest', () => {
    let s = withTasks();
    const t1 = new Date(2026, 10, 10, 9, 0);
    const t2 = new Date(2026, 10, 10, 9, 5);
    s = hiveReducer(s, { type: 'landed', id: 'hive:a', now: t1 });
    s = hiveReducer(s, { type: 'landed', id: 'hive:b', now: t2 });
    s = hiveReducer(s, { type: 'deleteLanding', at: t1.toISOString(), flowerId: 'hive:a' });
    expect(s.history.map((l) => l.flowerId)).toEqual(['hive:b']);
    expect(hiveReducer(s, { type: 'deleteLanding', at: 'nope', flowerId: 'hive:b' })).toBe(s);
  });

  it('ignores unknown ids', () => {
    const s = withTasks();
    expect(hiveReducer(s, { type: 'toggle', id: 'nope' })).toBe(s);
    expect(hiveReducer(s, { type: 'remove', id: 'nope', now })).toBe(s);
  });
});
