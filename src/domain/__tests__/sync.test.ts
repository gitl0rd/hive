import { mergeTodoist } from '../sync';
import type { Flower } from '../types';

const td = (id: string, extra: Partial<Flower> = {}): Flower => ({
  id: `todoist:${id}`,
  source: 'todoist',
  title: `task ${id}`,
  projectKey: 'p1',
  projectName: 'Inbox',
  color: '#aaaaaa',
  ...extra,
});
const hive = (id: string): Flower => ({
  id: `hive:${id}`,
  source: 'hive',
  title: `hive ${id}`,
  projectKey: 'hive',
  projectName: 'Hive',
  color: '#ffa526',
});

describe('mergeTodoist', () => {
  it('adds new Todoist flowers and counts them', () => {
    const r = mergeTodoist([td('1')], [td('1'), td('2'), td('3')]);
    expect(r.flowers.map((f) => f.id)).toEqual(['todoist:1', 'todoist:2', 'todoist:3']);
    expect(r.added).toBe(2);
    expect(r.gone).toBe(0);
  });

  it('never removes or changes Hive flowers', () => {
    const h = hive('a');
    const r = mergeTodoist([h, td('1')], []);
    expect(r.flowers[0]).toBe(h);
    expect(r.flowers).toHaveLength(2);
  });

  it('ignores Hive-sourced items in incoming', () => {
    const r = mergeTodoist([], [hive('x')]);
    expect(r.flowers).toEqual([]);
    expect(r.added).toBe(0);
  });

  it('marks missing Todoist flowers gone instead of removing them', () => {
    const r = mergeTodoist([td('1'), td('2')], [td('2')]);
    expect(r.flowers).toHaveLength(2);
    expect(r.flowers[0].goneFromTodoist).toBe(true);
    expect(r.flowers[1].goneFromTodoist).toBeUndefined();
    expect(r.gone).toBe(1);
  });

  it('refreshes title/project/colour/daysLate of existing flowers', () => {
    const r = mergeTodoist(
      [td('1', { daysLate: 2 })],
      [td('1', { title: 'renamed', projectKey: 'p2', projectName: 'Work', color: '#123456' })],
    );
    expect(r.flowers[0]).toEqual({
      id: 'todoist:1',
      source: 'todoist',
      title: 'renamed',
      projectKey: 'p2',
      projectName: 'Work',
      color: '#123456',
    });
    expect(r.added).toBe(0);
  });

  it('updates and clears daysLate', () => {
    expect(mergeTodoist([td('1')], [td('1', { daysLate: 3 })]).flowers[0].daysLate).toBe(3);
    expect(mergeTodoist([td('1', { daysLate: 3 })], [td('1')]).flowers[0].daysLate).toBeUndefined();
  });

  it('un-gones a flower that comes back', () => {
    const r = mergeTodoist([td('1', { goneFromTodoist: true })], [td('1')]);
    expect(r.flowers[0].goneFromTodoist).toBeUndefined();
  });

  it('keeps board order stable and does not mutate inputs', () => {
    const current = [td('2'), hive('a'), td('1')];
    const snapshot = JSON.parse(JSON.stringify(current));
    const r = mergeTodoist(current, [td('1'), td('3'), td('2')]);
    expect(r.flowers.map((f) => f.id)).toEqual(['todoist:2', 'hive:a', 'todoist:1', 'todoist:3']);
    expect(current).toEqual(snapshot);
  });
});
