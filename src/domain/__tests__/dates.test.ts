import { daysLate, hhmm, localDateKey } from '../dates';

describe('dates', () => {
  it('localDateKey uses the local calendar day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 10, 30, 0, 0))).toBe('2026-11-30');
  });

  it('daysLate counts whole local days, never negative', () => {
    const today = new Date(2026, 10, 10, 8, 0);
    expect(daysLate('2026-11-10', today)).toBe(0);
    expect(daysLate('2026-11-08', today)).toBe(2);
    expect(daysLate('2026-11-12', today)).toBe(0);
    expect(daysLate('2026-10-31T09:00:00', today)).toBe(10);
    expect(daysLate('garbage', today)).toBe(0);
  });

  it('daysLate is correct across a DST change', () => {
    expect(daysLate('2026-03-01', new Date(2026, 3, 1, 12))).toBe(31);
  });

  it('hhmm pads', () => {
    expect(hhmm(new Date(2026, 0, 1, 7, 5))).toBe('07:05');
  });
});
