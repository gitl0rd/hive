import AsyncStorage from '@react-native-async-storage/async-storage';

import { freshDay } from '../../domain/day';
import { KEYS, loadAll, save, saver } from '../storage';

// AsyncStorage is mapped to its official in-memory mock in the Jest config (package.json).

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage', () => {
  it('loads empty defaults on first run', async () => {
    await expect(loadAll()).resolves.toEqual({
      tasks: [],
      history: [],
      day: null,
      problems: [],
      empty: true,
    });
  });

  it('round-trips tasks, history and the day', async () => {
    const tasks = [{ id: 'a', title: 'Gym', createdAt: '2026-11-10T08:00:00.000Z' }];
    const history = [
      {
        flowerId: 'hive:a',
        title: 'Gym',
        projectName: 'Hive',
        color: '#FFA526',
        at: '2026-11-10T08:00:00.000Z',
      },
    ];
    const day = {
      ...freshDay('2026-11-10', 5),
      excluded: ['hive:a'],
      todoistFlowers: [
        {
          id: 'todoist:1',
          source: 'todoist' as const,
          title: 'x',
          projectKey: 'p',
          projectName: 'P',
          color: '#999999',
          daysLate: 2,
        },
      ],
    };
    await save.tasks(tasks);
    await save.history(history);
    await save.day(day);
    await expect(loadAll()).resolves.toEqual({ tasks, history, day, problems: [], empty: false });
  });

  it('ignores corrupt or wrongly-shaped data and reports it', async () => {
    await AsyncStorage.setItem(KEYS.tasks, '{not json');
    await AsyncStorage.setItem(KEYS.history, JSON.stringify({ v: 1, data: [{ nope: true }] }));
    await AsyncStorage.setItem(
      KEYS.day,
      JSON.stringify({ v: 99, data: freshDay('2026-11-10', 1) }),
    );
    const loaded = await loadAll();
    expect(loaded.tasks).toEqual([]);
    expect(loaded.history).toEqual([]);
    expect(loaded.day).toBeNull();
    expect(loaded.problems.sort()).toEqual([KEYS.day, KEYS.history, KEYS.tasks].sort());
  });

  it('keeps Demo mode data separate from real data', async () => {
    await saver('hive.demo').tasks([{ id: 'd', title: 'Demo', createdAt: '2026-11-10T08:00:00Z' }]);
    expect((await loadAll('hive')).tasks).toEqual([]);
    expect((await loadAll('hive.demo')).tasks.map((t) => t.title)).toEqual(['Demo']);
  });

  it('never stores a token key', async () => {
    await save.tasks([]);
    await save.day(freshDay('2026-11-10', 1));
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => /token/i.test(k))).toBe(false);
  });
});
