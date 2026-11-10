import { lateTag, pad2, projectCode, wrapLabel } from '../labels';

describe('projectCode', () => {
  it.each([
    ['Mega Dog', 'MDG'],
    ['Inbox', 'INB'],
    ['Hive', 'HIV'],
    ['Work', 'WRK'],
    ['Side Project Ideas', 'SPI'],
    ['AI', 'AI-'],
    ['', '---'],
    ['🐝 Garden', 'GRD'],
  ])('%s -> %s', (name, code) => {
    expect(projectCode(name)).toBe(code);
  });
});

describe('lateTag / pad2', () => {
  it('formats', () => {
    expect(lateTag(2)).toBe('!2D');
    expect(lateTag(0)).toBe('');
    expect(lateTag(undefined)).toBe('');
    expect(pad2(7)).toBe('07');
    expect(pad2(123)).toBe('123');
  });
});

describe('wrapLabel', () => {
  it('wraps on words', () => {
    expect(wrapLabel('REMOVE A FF PHOTO', 9, 3)).toEqual(['REMOVE A', 'FF PHOTO']);
    expect(wrapLabel('GYM', 9, 3)).toEqual(['GYM']);
  });

  it('hard-breaks long words', () => {
    expect(wrapLabel('SUPERCALIFRAGILISTIC', 8, 3)).toEqual(['SUPERCAL', 'IFRAGILI', 'STIC']);
  });

  it('ellipsises when out of lines', () => {
    const out = wrapLabel('ONE TWO THREE FOUR FIVE SIX', 7, 2);
    expect(out).toHaveLength(2);
    expect(out[1].endsWith('…')).toBe(true);
    expect(out.every((l) => l.length <= 7)).toBe(true);
  });

  it('handles empty input', () => {
    expect(wrapLabel('   ', 5, 2)).toEqual([]);
  });
});
