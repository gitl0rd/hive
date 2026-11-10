import { appendLog, log, LOG_CAP } from '../logLines';

const at = new Date(2026, 10, 10, 9, 5);

describe('log lines', () => {
  it('formats like the design', () => {
    expect(log.dispatch(at)).toBe('09:05 > dispatch bee');
    expect(log.hop(3, 'Tidy the Desk')).toBe('      hop 03  tidy the desk');
    expect(log.landed(at, 'pocket goblin', 'Mega Dog')).toBe(
      '09:05 > LANDED: POCKET GOBLIN [MEGA DOG]',
    );
    expect(log.removed(at, 'Gym')).toBe('09:05 > rm gym --today');
    expect(log.done(at, 'Gym')).toBe('09:05 > done gym');
    expect(log.sync(at, 3, 4)).toBe('09:05 > sync todoist ... +3 new, 4 hive kept');
  });

  it('caps the log', () => {
    const many = Array.from({ length: LOG_CAP }, (_, i) => `l${i}`);
    const next = appendLog(many, 'a', 'b');
    expect(next).toHaveLength(LOG_CAP);
    expect(next[next.length - 1]).toBe('b');
    expect(next[0]).toBe('l2');
  });
});
