import type React from 'react';
import { Circle, Defs, G, Pattern } from 'react-native-svg';

import type { Backdrop } from '../themes';
import { pixelatePath } from './pixelPath';

// Faint repeating pattern drawn behind everything (a theme's `backdrop`): one SVG pattern tile;
// `k` scales it up a little on desktop.

/** Brain folds (gyri), 140×120. The first BRAIN HIVE design. */
const GYRI =
  'M0 18 C 18 4, 30 34, 48 18 S 80 2, 96 20 S 124 34, 140 18 M0 62 C 14 48, 34 50, 40 66 S 62 84, 76 64 S 104 46, 116 62 S 132 76, 140 62 M0 104 C 20 92, 28 118, 50 106 S 84 88, 100 104 S 126 116, 140 104 M24 30 C 16 40, 30 46, 22 54 M70 22 C 78 32, 64 40, 72 50 M112 74 C 104 84, 118 90, 110 98 M58 84 C 50 92, 64 98, 56 108';

/**
 * Wave crests (beach), 140×120: three rows of rolling swell, each a 70-wide period so the tile
 * repeats seamlessly, alternate rows half a period out, plus a few short foam flecks.
 */
const WAVES =
  'M0 20 C 12 8, 23 8, 35 20 S 58 32, 70 20 S 93 8, 105 20 S 128 32, 140 20 M0 60 C 12 72, 23 72, 35 60 S 58 48, 70 60 S 93 72, 105 60 S 128 48, 140 60 M0 100 C 12 88, 23 88, 35 100 S 58 112, 70 100 S 93 88, 105 100 S 128 112, 140 100 M48 38 L 60 38 M112 80 L 124 80 M14 80 L 22 80';

/** Dot pitch, in tile units (140×120 tile = 35×30 dots). */
const CELL = 4;
const DOT_COLS = 140 / CELL;
const DOT_ROWS = 120 / CELL;

const litCells = (d: string) =>
  new Set(pixelatePath(d, 140, 120, CELL).map(([c, r]) => `${c},${r}`));
const LIT: Record<Exclude<Backdrop, 'none'>, Set<string>> = {
  gyri: litCells(GYRI),
  waves: litCells(WAVES),
};

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
  const tile = (children: React.ReactNode) => (
    <Defs>
      <Pattern id={ID} width={140 * k} height={120 * k} patternUnits="userSpaceOnUse">
        <G transform={`scale(${k})`}>{children}</G>
      </Pattern>
    </Defs>
  );
  // LED dot-matrix: a faint grid of dots, the ones on the pattern (brain folds, waves) lit brighter.
  const lit = LIT[kind];
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < DOT_ROWS; r++) {
    for (let c = 0; c < DOT_COLS; c++) {
      const on = lit.has(`${c},${r}`);
      dots.push(
        <Circle
          key={`${c}-${r}`}
          cx={c * CELL + CELL / 2}
          cy={r * CELL + CELL / 2}
          r={on ? 1.3 : 0.7}
          fill={color}
          fillOpacity={on ? 0.16 : 0.035}
        />,
      );
    }
  }
  return tile(<>{dots}</>);
}

export const BACKDROP_FILL = `url(#${ID})`;
