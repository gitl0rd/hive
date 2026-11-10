import {
  cleanTitle,
  freshDay,
  hiveFlowerId,
  hiveFlowers,
  hiveTaskIdOf,
  isFinished,
  needsRollover,
} from '../day';
import type { HiveTask } from '../types';

describe('day', () => {
  it('freshDay starts empty with a boot line', () => {
    const d = freshDay('2026-11-10', 42);
    expect(d).toEqual({
      date: '2026-11-10',
      todoistFlowers: [],
      excluded: [],
      hidden: [],
      hiveDone: 0,
      log: ['HIVE.EXE v2.0'],
      seed: 42,
      todoistDone: 0,
    });
  });

  it('needsRollover when missing or a different date', () => {
    expect(needsRollover(null, '2026-11-10')).toBe(true);
    expect(needsRollover(freshDay('2026-11-09', 1), '2026-11-10')).toBe(true);
    expect(needsRollover(freshDay('2026-11-10', 1), '2026-11-10')).toBe(false);
  });

  it('hive ids round-trip', () => {
    expect(hiveTaskIdOf(hiveFlowerId('abc'))).toBe('abc');
    expect(hiveTaskIdOf('todoist:1')).toBeNull();
  });
});

describe('hive tasks on the board', () => {
  const today = '2026-11-10';
  const tasks: HiveTask[] = [
    { id: 'a', title: 'Open', createdAt: '2026-11-01T10:00:00' },
    {
      id: 'b',
      title: 'Done today',
      createdAt: '2026-11-01T10:00:00',
      doneAt: '2026-11-10T08:00:00',
    },
    {
      id: 'c',
      title: 'Done yesterday',
      createdAt: '2026-11-01T10:00:00',
      doneAt: '2026-11-09T22:00:00',
    },
  ];

  it('carries undone tasks over and keeps today-done ones; drops earlier-done ones', () => {
    expect(isFinished(tasks[1], today)).toBe(false);
    expect(isFinished(tasks[2], today)).toBe(true);
    expect(hiveFlowers(tasks, today).map((f) => f.id)).toEqual(['hive:a', 'hive:b']);
  });

  it('maps to Hive flowers in the screen colour', () => {
    expect(hiveFlowers([tasks[0]], today)[0]).toEqual({
      id: 'hive:a',
      source: 'hive',
      title: 'Open',
      projectKey: 'hive',
      projectName: 'Hive',
      color: '#FFA526',
    });
  });

  it('cleanTitle trims, collapses and rejects blanks', () => {
    expect(cleanTitle('  water   the\nplants ')).toBe('water the plants');
    expect(cleanTitle('   ')).toBeNull();
    expect(cleanTitle('x'.repeat(500))).toHaveLength(120);
  });
});
