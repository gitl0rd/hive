import { sampleFlowers } from '../../demo/sampleData';
import { boardReducer, type BoardState, HISTORY_CAP } from '../boardReducer';

const now = new Date(2026, 10, 10, 9, 30);
const base: BoardState = {
  flowers: sampleFlowers,
  excluded: [],
  log: [],
  history: [],
  hiveDone: 0,
  todoistDone: 0,
  seed: 1,
};

describe('boardReducer', () => {
  it('toggles exclusion', () => {
    const a = boardReducer(base, { type: 'toggle', id: 'todoist:1' });
    expect(a.excluded).toEqual(['todoist:1']);
    expect(boardReducer(a, { type: 'toggle', id: 'todoist:1' }).excluded).toEqual([]);
  });

  it('REMOVE excludes for today and logs, without touching the flower', () => {
    const s = boardReducer(base, { type: 'remove', id: 'todoist:1', now });
    expect(s.excluded).toEqual(['todoist:1']);
    expect(s.log).toEqual(['09:30 > rm pocket goblin --today']);
    expect(s.flowers).toBe(base.flowers);
  });

  it('DONE works for Hive tasks only', () => {
    const s = boardReducer(base, { type: 'done', id: 'hive:4', now });
    expect(s.hiveDone).toBe(1);
    expect(s.excluded).toEqual(['hive:4']);
    expect(s.log).toEqual(['09:30 > done gym']);
    expect(boardReducer(base, { type: 'done', id: 'todoist:1', now })).toBe(base);
  });

  it('landing records history (newest first, capped) and logs', () => {
    let s = boardReducer(base, { type: 'landed', id: 'todoist:1', now });
    expect(s.history[0]).toMatchObject({
      flowerId: 'todoist:1',
      title: 'pocket goblin',
      projectName: 'Mega Dog',
    });
    expect(s.log).toEqual(['09:30 > LANDED: POCKET GOBLIN [MEGA DOG]']);
    for (let i = 0; i < HISTORY_CAP + 5; i++)
      s = boardReducer(s, { type: 'landed', id: 'hive:1', now });
    expect(s.history).toHaveLength(HISTORY_CAP);
    expect(s.history[0].flowerId).toBe('hive:1');
  });

  it('ignores unknown ids', () => {
    expect(boardReducer(base, { type: 'remove', id: 'nope', now })).toBe(base);
    expect(boardReducer(base, { type: 'landed', id: 'nope', now })).toBe(base);
  });
});
