import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { freshDay } from '../../domain/day';
import { localDateKey } from '../../domain/dates';
import type { Flower } from '../../domain/types';
import { KEYS } from '../storage';
import { useHive } from '../useHive';

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});

const td = (id: string): Flower => ({
  id: `todoist:${id}`,
  source: 'todoist',
  title: `task ${id}`,
  projectKey: 'p',
  projectName: 'Inbox',
  color: '#999999',
});
const source = jest.fn(async () => ({ flowers: [td('1'), td('2')], completedToday: 3 }));

beforeEach(async () => {
  await AsyncStorage.clear();
  source.mockClear();
});

async function mount() {
  const hook = await renderHook(() => useHive(source));
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  await waitFor(() => expect(source).toHaveBeenCalled());
  return hook;
}

describe('useHive', () => {
  it('first run: fresh day, boot sync from the source', async () => {
    const { result } = await mount();
    await waitFor(() => expect(result.current.state.day.todoistFlowers).toHaveLength(2));
    expect(result.current.state.day.date).toBe(localDateKey(new Date()));
    expect(result.current.state.day.todoistDone).toBe(3);
    expect(result.current.state.day.log.some((l) => l.endsWith('> ready.'))).toBe(true);
  });

  it('Hive tasks survive an app restart', async () => {
    const first = await mount();
    await act(async () => first.result.current.addTask('  Water the plants '));
    expect(first.result.current.state.tasks.map((t) => t.title)).toEqual(['Water the plants']);
    await waitFor(async () => expect(await AsyncStorage.getItem(KEYS.tasks)).toContain('Water'));
    await first.unmount();

    const second = await mount();
    await waitFor(() =>
      expect(second.result.current.state.tasks.map((t) => t.title)).toEqual(['Water the plants']),
    );
    expect(second.result.current.flowers.some((f) => f.title === 'Water the plants')).toBe(true);
  });

  it('a stored day from yesterday rolls over on open, keeping Hive tasks', async () => {
    const yesterday = { ...freshDay('2000-01-01', 1), excluded: ['todoist:9'], hiveDone: 4 };
    await AsyncStorage.setItem(KEYS.day, JSON.stringify({ v: 1, data: yesterday }));
    await AsyncStorage.setItem(
      KEYS.tasks,
      JSON.stringify({
        v: 1,
        data: [{ id: 'k', title: 'Keep me', createdAt: '2000-01-01T00:00:00Z' }],
      }),
    );
    const { result } = await mount();
    await waitFor(() => expect(result.current.state.day.todoistFlowers).toHaveLength(2));
    expect(result.current.state.day.date).toBe(localDateKey(new Date()));
    expect(result.current.state.day.excluded).toEqual([]);
    expect(result.current.state.day.hiveDone).toBe(0);
    expect(result.current.flowers.map((f) => f.id)).toContain('hive:k');
  });

  it("today's stored day is kept (exclusions survive a restart)", async () => {
    const today = {
      ...freshDay(localDateKey(new Date()), 1),
      excluded: ['todoist:1'],
      hiveDone: 2,
    };
    await AsyncStorage.setItem(KEYS.day, JSON.stringify({ v: 1, data: today }));
    const { result } = await mount();
    await waitFor(() => expect(result.current.state.day.todoistFlowers).toHaveLength(2));
    expect(result.current.state.day.excluded).toEqual(['todoist:1']);
    expect(result.current.state.day.hiveDone).toBe(2);
  });

  it('a failing source logs and keeps the last data', async () => {
    source.mockRejectedValueOnce(Object.assign(new Error('nope'), { status: 401 }));
    const { result } = await mount();
    await waitFor(() =>
      expect(result.current.state.day.log.some((l) => l.includes('FAILED (bad token)'))).toBe(true),
    );
  });
});
