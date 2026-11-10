import { boardCounts, eligibleIds, layoutItems } from '../board';
import type { Flower } from '../types';

const f = (id: string, extra: Partial<Flower> = {}): Flower => ({
  id,
  source: 'todoist',
  title: id,
  projectKey: 'p',
  projectName: 'P',
  color: '#fff',
  ...extra,
});

describe('board selectors', () => {
  const flowers = [
    f('a', { daysLate: 2 }),
    f('b'),
    f('c', { goneFromTodoist: true, daysLate: 1 }),
    f('d', { daysLate: 5 }),
  ];

  it('eligible = not excluded and not gone', () => {
    expect([...eligibleIds(flowers, ['d'])].sort()).toEqual(['a', 'b']);
  });

  it('counts FLWR and LATE over eligible flowers only', () => {
    expect(boardCounts(flowers, [])).toEqual({ flowers: 3, late: 2 });
    expect(boardCounts(flowers, ['a'])).toEqual({ flowers: 2, late: 1 });
  });

  it('groups layout items by project', () => {
    expect(layoutItems([f('x', { projectKey: 'k' })])).toEqual([{ id: 'x', group: 'k' }]);
  });
});
