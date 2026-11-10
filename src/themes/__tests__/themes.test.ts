import { HIVE_COLOR } from '../../domain/types';
import { log } from '../../domain/logLines';
import {
  DEFAULT_THEME_ID,
  getTheme,
  getThemeTokens,
  isThemeId,
  itemColor,
  themeLogLine,
  THEMES,
} from '..';
import { BEE, BRAIN, spriteRuns } from '../sprites';
import { blend, hexToRgb } from '../tokens';

const at = new Date(2026, 10, 10, 12, 16);

describe('theme directory', () => {
  it('lists hive (default) and brain', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['hive', 'brain']);
    expect(DEFAULT_THEME_ID).toBe('hive');
    expect(isThemeId('brain')).toBe(true);
    expect(isThemeId('nope')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });

  it('every theme fills every word', () => {
    const keys = (o: object) => Object.keys(o).sort();
    for (const t of THEMES) {
      expect(keys(t.words)).toEqual(keys(getTheme('hive').words));
      for (const [k, v] of Object.entries(t.words)) {
        if (typeof v === 'string') expect(`${k}:${v}`).not.toBe(`${k}:`);
      }
    }
  });

  it('caches tokens per theme', () => {
    expect(getThemeTokens('brain')).toBe(getThemeTokens('brain'));
    expect(getThemeTokens('brain')).not.toBe(getThemeTokens('hive'));
  });

  it('brain matches the BRAIN HIVE design', () => {
    const t = getThemeTokens('brain');
    expect(t.bg).toBe('#0E0509');
    expect(t.screen).toBe('#FF8FB8');
    expect(t.a(0.07)).toBe('rgba(255,143,184,0.07)');
    expect(t.hive).toBe('#7FE3FF');
    expect(t.theme.words.brand).toBe('BRAIN·HIVE');
    expect(t.theme.words.spin).toBe('▶ THINK');
    expect(t.theme.sprite).toBe(BRAIN);
  });
});

describe('colours', () => {
  it('hexToRgb / blend', () => {
    expect(hexToRgb('#FFA526')).toEqual([255, 165, 38]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(blend('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('hive tasks take the theme colour; Todoist colours never change', () => {
    const brain = getThemeTokens('brain');
    expect(itemColor(HIVE_COLOR, true, brain)).toBe('#7FE3FF');
    expect(itemColor('#E05194', false, brain)).toBe('#E05194');
    expect(itemColor(HIVE_COLOR, true, getThemeTokens('hive'))).toBe(HIVE_COLOR);
  });
});

describe('themeLogLine', () => {
  const brain = getTheme('brain');
  const hive = getTheme('hive');

  it('leaves the hive log alone', () => {
    const line = log.dispatch(at);
    expect(themeLogLine(line, hive)).toBe(line);
  });

  it('rewrites the bee words for brain, as in the design', () => {
    expect(themeLogLine(log.boot(), brain)).toBe('BRAIN.HIVE v2.0');
    expect(themeLogLine(log.dispatch(at), brain)).toBe('12:16 > fire synapse');
    expect(themeLogLine(log.hop(3, 'Gym'), brain)).toBe('      spark 03  gym');
    expect(themeLogLine(log.landed(at, 'Pocket goblin', 'Mega Dog'), brain)).toBe(
      '12:16 > FOCUS: POCKET GOBLIN [MEGA DOG]',
    );
    expect(themeLogLine(log.overdue(at, 3), brain)).toBe('12:16 > 3 thoughts overdue');
    expect(themeLogLine(log.overdue(at, 1), brain)).toBe('12:16 > 1 thought overdue');
    expect(themeLogLine(log.nothingToSpin(at), brain)).toBe('12:16 > no thoughts to fire');
    expect(themeLogLine(log.shuffled(at), brain)).toBe('12:16 > shuffle cortex ... ok');
    expect(themeLogLine(log.reset(at, true), brain)).toBe(
      '12:16 > recall synapse ... firing aborted',
    );
    expect(themeLogLine(log.reset(at, false), brain)).toBe(
      '12:16 > reset cortex ... brain at rest',
    );
  });

  it("never rewrites a task's own title", () => {
    expect(themeLogLine(log.hop(1, 'dispatch bee hop LANDED'), brain)).toBe(
      '      spark 01  dispatch bee hop landed',
    );
    expect(themeLogLine(log.added(at, 'dispatch bee'), brain)).toBe(
      '12:16 > add "dispatch bee" ... ok',
    );
    expect(themeLogLine(log.done(at, 'LANDED: x'), brain)).toBe('12:16 > done landed: x');
  });
});

describe('sprites', () => {
  it.each([BEE, BRAIN])('$id rows match its size', (s) => {
    expect(s.rows).toHaveLength(s.h);
    for (const r of s.rows) expect(r).toHaveLength(s.w);
  });

  it('merges runs', () => {
    const runs = spriteRuns(BEE);
    expect(runs[0]).toEqual({ x: 3, y: 0, w: 2, kind: 'W' });
    const px = runs.reduce((n, r) => n + r.w, 0);
    const want = BEE.rows.join('').replace(/\./g, '').length;
    expect(px).toBe(want);
  });
});
