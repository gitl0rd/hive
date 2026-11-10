import { Circle, Defs, G, Line, Path, Pattern, Text as SvgText } from 'react-native-svg';

import type { Backdrop } from '../themes';
import { fonts } from './theme';

// Faint repeating patterns drawn behind everything (a theme's `backdrop`). Each is one SVG
// pattern tile; `k` scales it up a little on desktop.

/** Brain folds (gyri), 140×120. The first BRAIN HIVE design. */
const GYRI =
  'M0 18 C 18 4, 30 34, 48 18 S 80 2, 96 20 S 124 34, 140 18 M0 62 C 14 48, 34 50, 40 66 S 62 84, 76 64 S 104 46, 116 62 S 132 76, 140 62 M0 104 C 20 92, 28 118, 50 106 S 84 88, 100 104 S 126 116, 140 104 M24 30 C 16 40, 30 46, 22 54 M70 22 C 78 32, 64 40, 72 50 M112 74 C 104 84, 118 90, 110 98 M58 84 C 50 92, 64 98, 56 108';

/** mulberry32: same tile every render. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- hexdump: a memory dump of the brain, rows of offset · hex · ascii --------------------------

const WORDS = ['CORTEX', 'SYNAPSE', 'NEURON', 'AXON', 'DENDRITE', 'THOUGHT', 'FOCUS', 'MEMORY'];

export function hexdumpLines(rows: number): string[] {
  const r = rng(7);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    const word = WORDS[i % WORDS.length];
    const bytes: number[] = [];
    for (let b = 0; b < 16; b++) {
      const at = b - 3;
      bytes.push(at >= 0 && at < word.length ? word.charCodeAt(at) : Math.floor(r() * 256));
    }
    const hex = bytes.map((b) => b.toString(16).padStart(2, '0'));
    const ascii = bytes
      .map((b) => (b >= 0x41 && b <= 0x5a ? String.fromCharCode(b) : '.'))
      .join('');
    const off = (0x7f3a00 + i * 16).toString(16).padStart(8, '0');
    out.push(`${off}  ${hex.slice(0, 8).join(' ')}  ${hex.slice(8).join(' ')}  |${ascii}|`);
  }
  return out;
}

// --- eeg: oscilloscope graticule with brainwave traces -------------------------------------------

/** A brainwave across `w` that starts and ends on its baseline, so tiles join up. */
export function eegPath(w: number, y0: number, amp: number, seed: number): string {
  const r = rng(seed);
  const pts: string[] = [`M0 ${y0}`];
  for (let x = 6; x < w - 6; x += 6) {
    const spike = r() < 0.06;
    const y = y0 + (spike ? (r() < 0.5 ? -1 : 1) * amp * 2.4 : (r() - 0.5) * amp);
    pts.push(`L${x} ${y.toFixed(1)}`);
  }
  pts.push(`L${w} ${y0}`);
  return pts.join(' ');
}

// --- circuit: neural traces like a circuit board, 240×240, joined at the tile edges -------------

const TRACES = [
  'M0 40 H70 L100 70 H170 L200 40 H240',
  'M0 150 H40 L70 180 H140',
  'M140 180 L170 150 H240',
  'M60 0 V20 L80 40',
  'M60 240 V200 L90 170',
  'M200 0 V30',
  'M200 240 V210 L170 180',
  'M120 70 V120 L150 150',
  'M20 100 H90 L110 120',
];
const PADS: [number, number][] = [
  [100, 70],
  [170, 70],
  [140, 180],
  [80, 40],
  [90, 170],
  [200, 30],
  [120, 120],
  [150, 150],
  [20, 100],
  [110, 120],
];

const ID = 'backdrop';

/** The pattern <Defs> for a backdrop, or null for none. Fill a Rect with `url(#backdrop)`. */
export function BackdropDefs({
  kind,
  color,
  desktop,
}: {
  kind: Backdrop;
  color: string;
  desktop: boolean;
}) {
  const k = desktop ? 1.2 : 1;
  if (kind === 'none') return null;
  if (kind === 'gyri') {
    return (
      <Defs>
        <Pattern id={ID} width={140 * k} height={120 * k} patternUnits="userSpaceOnUse">
          <G transform={`scale(${k})`}>
            <Path
              d={GYRI}
              fill="none"
              stroke={color}
              strokeOpacity={0.07}
              strokeWidth={desktop ? 3 : 2.5}
              strokeLinecap="round"
            />
          </G>
        </Pattern>
      </Defs>
    );
  }
  if (kind === 'hexdump') {
    const lines = hexdumpLines(8);
    const fs = desktop ? 14 : 11;
    const lh = fs * 1.6;
    const w = fs * 0.5 * (lines[0].length + 6);
    return (
      <Defs>
        <Pattern id={ID} width={w} height={lh * lines.length} patternUnits="userSpaceOnUse">
          {lines.map((ln, i) => (
            <SvgText
              key={i}
              x={0}
              y={lh * (i + 0.8)}
              fontFamily={fonts.body}
              fontSize={fs}
              fill={color}
              fillOpacity={0.075}
            >
              {ln}
            </SvgText>
          ))}
        </Pattern>
      </Defs>
    );
  }
  if (kind === 'eeg') {
    const W = 480 * k;
    const H = 240 * k;
    const minor = 24 * k;
    return (
      <Defs>
        <Pattern id={ID} width={W} height={H} patternUnits="userSpaceOnUse">
          {Array.from({ length: W / minor }, (_, i) => (
            <Line
              key={`v${i}`}
              x1={i * minor}
              x2={i * minor}
              y1={0}
              y2={H}
              stroke={color}
              strokeOpacity={i % 5 === 0 ? 0.07 : 0.03}
              strokeWidth={1}
              strokeDasharray={i % 5 === 0 ? undefined : '2 4'}
            />
          ))}
          {Array.from({ length: H / minor }, (_, i) => (
            <Line
              key={`h${i}`}
              x1={0}
              x2={W}
              y1={i * minor}
              y2={i * minor}
              stroke={color}
              strokeOpacity={i % 5 === 0 ? 0.07 : 0.03}
              strokeWidth={1}
              strokeDasharray={i % 5 === 0 ? undefined : '2 4'}
            />
          ))}
          {[0.3, 0.7].map((f, i) => (
            <Path
              key={`w${i}`}
              d={eegPath(W, H * f, 7 * k, 3 + i)}
              fill="none"
              stroke={color}
              strokeOpacity={0.09}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          ))}
        </Pattern>
      </Defs>
    );
  }
  // circuit
  return (
    <Defs>
      <Pattern id={ID} width={240 * k} height={240 * k} patternUnits="userSpaceOnUse">
        <G transform={`scale(${k})`}>
          {TRACES.map((d, i) => (
            <Path key={i} d={d} fill="none" stroke={color} strokeOpacity={0.07} strokeWidth={2} />
          ))}
          {PADS.map(([x, y], i) => (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="none"
              stroke={color}
              strokeOpacity={0.1}
              strokeWidth={2}
            />
          ))}
        </G>
      </Pattern>
    </Defs>
  );
}

export const BACKDROP_FILL = `url(#${ID})`;
