import type React from 'react';
import { Circle, Defs, G, Pattern } from 'react-native-svg';

import type { Backdrop } from '../themes';
import { pixelatePath } from './pixelPath';

// Faint repeating pattern drawn behind everything (a theme's `backdrop`): one SVG pattern tile;
// `k` scales it up a little on desktop.

/** Brain folds (gyri), 140×120. The first BRAIN HIVE design. */
const GYRI =
  'M0 18 C 18 4, 30 34, 48 18 S 80 2, 96 20 S 124 34, 140 18 M0 62 C 14 48, 34 50, 40 66 S 62 84, 76 64 S 104 46, 116 62 S 132 76, 140 62 M0 104 C 20 92, 28 118, 50 106 S 84 88, 100 104 S 126 116, 140 104 M24 30 C 16 40, 30 46, 22 54 M70 22 C 78 32, 64 40, 72 50 M112 74 C 104 84, 118 90, 110 98 M58 84 C 50 92, 64 98, 56 108';

/** Dot pitch, in tile units (140×120 tile = 35×30 dots). */
const GYRI_CELL = 4;
const GYRI_LIT = new Set(pixelatePath(GYRI, 140, 120, GYRI_CELL).map(([c, r]) => `${c},${r}`));

const DOT_COLS = 140 / GYRI_CELL;
const DOT_ROWS = 120 / GYRI_CELL;

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
  if (kind === 'gyri') {
    // LED dot-matrix: a faint grid of dots, the ones on the brain folds lit brighter.
    const dots: React.ReactNode[] = [];
    for (let r = 0; r < DOT_ROWS; r++) {
      for (let c = 0; c < DOT_COLS; c++) {
        const on = GYRI_LIT.has(`${c},${r}`);
        dots.push(
          <Circle
            key={`${c}-${r}`}
            cx={c * GYRI_CELL + GYRI_CELL / 2}
            cy={r * GYRI_CELL + GYRI_CELL / 2}
            r={on ? 1.3 : 0.7}
            fill={color}
            fillOpacity={on ? 0.16 : 0.035}
          />,
        );
      }
    }
    return tile(<>{dots}</>);
  }
  return null;
}

export const BACKDROP_FILL = `url(#${ID})`;
