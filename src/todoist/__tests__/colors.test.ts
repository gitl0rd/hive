import {
  brighten,
  displayColor,
  hexToRgb,
  hslLightness,
  MIN_LIGHTNESS,
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
      const c = displayColor(name);
      const ok = relativeLuminance(c) >= MIN_LUMINANCE || hslLightness(c) >= MIN_LIGHTNESS - 0.005;
      expect({ name, c, ok }).toEqual({ name, c, ok: true });
    }
  });

  it('keeps magenta as in the K design (#E05194)', () => {
    const got = hexToRgb(displayColor('magenta'));
    const want = hexToRgb('#e05194');
    got.forEach((v, i) => expect(Math.abs(v - want[i])).toBeLessThanOrEqual(2));
  });

  it('lifts genuinely dark colours (green, teal, berry red)', () => {
    for (const name of ['green', 'teal', 'berry_red'] as const) {
      expect(relativeLuminance(displayColor(name))).toBeGreaterThan(
        relativeLuminance(TODOIST_COLORS[name]),
      );
    }
  });

  it('leaves already-bright colours alone', () => {
    expect(displayColor('yellow')).toBe('#fad000');
    expect(displayColor('blue')).toBe('#4073ff');
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
