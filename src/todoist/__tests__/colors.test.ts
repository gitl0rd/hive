import {
  brighten,
  displayColor,
  MIN_LUMINANCE,
  relativeLuminance,
  TODOIST_COLORS,
} from '../colors';

describe('todoist colours', () => {
  it('charcoal brightens to about #9A9A9A', () => {
    const c = displayColor('charcoal');
    const v = parseInt(c.slice(1, 3), 16);
    expect(c.slice(1, 3)).toBe(c.slice(3, 5));
    expect(c.slice(3, 5)).toBe(c.slice(5, 7));
    expect(Math.abs(v - 0x9a)).toBeLessThanOrEqual(3);
  });

  it('every display colour is bright enough for the dark background', () => {
    for (const name of Object.keys(TODOIST_COLORS)) {
      expect(relativeLuminance(displayColor(name))).toBeGreaterThanOrEqual(MIN_LUMINANCE - 0.005);
    }
  });

  it('leaves already-bright colours alone', () => {
    expect(displayColor('yellow')).toBe('#fad000');
    expect(displayColor('grey')).toBe('#b8b8b8');
    expect(brighten('#FFFFFF')).toBe('#ffffff');
  });

  it('keeps the hue when brightening (blue stays blue)', () => {
    const c = displayColor('blue');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('falls back to grey for unknown names', () => {
    expect(displayColor('not_a_colour')).toBe('#b8b8b8');
    expect(displayColor(undefined)).toBe('#b8b8b8');
  });
});
