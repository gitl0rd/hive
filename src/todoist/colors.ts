// Todoist colour names -> display hex, brightened where too dark for the near-black background.

export const TODOIST_COLORS = {
  berry_red: '#b8256f',
  red: '#db4035',
  orange: '#ff9933',
  yellow: '#fad000',
  olive_green: '#afb83b',
  lime_green: '#7ecc49',
  green: '#299438',
  mint_green: '#6accbc',
  teal: '#158fad',
  sky_blue: '#14aaf5',
  light_blue: '#96c3eb',
  blue: '#4073ff',
  grape: '#884dff',
  violet: '#af38eb',
  lavender: '#eb96eb',
  magenta: '#e05194',
  salmon: '#ff8d85',
  charcoal: '#808080',
  grey: '#b8b8b8',
  taupe: '#ccac93',
} as const;

export type TodoistColorName = keyof typeof TODOIST_COLORS;

/**
 * A colour is "too dark for the near-black background" when its relative luminance is below
 * MIN_LUMINANCE *and* its HSL lightness is below MIN_LIGHTNESS. Those get their lightness raised
 * to MIN_LIGHTNESS, keeping hue and saturation. This matches the K design: charcoal #808080 ->
 * #999999, while magenta #E05194 stays as is and vivid-but-dark-ish colours like yellow are untouched.
 */
export const MIN_LUMINANCE = 0.32;
export const MIN_LIGHTNESS = 0.6;

const FALLBACK = TODOIST_COLORS.grey;

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

export function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** WCAG relative luminance, 0..1. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

export function hslLightness(hex: string): number {
  return rgbToHsl(hexToRgb(hex))[2];
}

/** Raise HSL lightness to MIN_LIGHTNESS for colours too dark for the background (see above). */
export function brighten(hex: string): string {
  const [h, sat, l] = rgbToHsl(hexToRgb(hex));
  if (relativeLuminance(hex) >= MIN_LUMINANCE || l >= MIN_LIGHTNESS) return hex.toLowerCase();
  return rgbToHex(hslToRgb([h, sat, MIN_LIGHTNESS]));
}

/** Todoist colour name -> display hex for the dark board. Unknown names fall back to grey. */
export function displayColor(name: string | undefined | null): string {
  const hex = (name && TODOIST_COLORS[name as TodoistColorName]) || FALLBACK;
  return brighten(hex);
}
