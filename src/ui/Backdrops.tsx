import { Defs, G, Pattern, Rect } from 'react-native-svg';

import type { Backdrop } from '../themes';
import { pixelatePath } from './pixelPath';

// Faint repeating pattern drawn behind everything (a theme's `backdrop`): one SVG pattern tile;
// `k` scales it up a little on desktop.

/** Brain folds (gyri), 140×120. The first BRAIN HIVE design. */
const GYRI =
  'M0 18 C 18 4, 30 34, 48 18 S 80 2, 96 20 S 124 34, 140 18 M0 62 C 14 48, 34 50, 40 66 S 62 84, 76 64 S 104 46, 116 62 S 132 76, 140 62 M0 104 C 20 92, 28 118, 50 106 S 84 88, 100 104 S 126 116, 140 104 M24 30 C 16 40, 30 46, 22 54 M70 22 C 78 32, 64 40, 72 50 M112 74 C 104 84, 118 90, 110 98 M58 84 C 50 92, 64 98, 56 108';

/** Pixel size of the folds, in tile units (140×120 tile = 35×30 pixels). */
const GYRI_CELL = 4;
const GYRI_PIXELS = pixelatePath(GYRI, 140, 120, GYRI_CELL);

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
    // Brain folds as chunky pixels, like the sprite and the CRT text.
    return (
      <Defs>
        <Pattern id={ID} width={140 * k} height={120 * k} patternUnits="userSpaceOnUse">
          <G transform={`scale(${k})`}>
            {GYRI_PIXELS.map(([c, r]) => (
              <Rect
                key={`${c}-${r}`}
                x={c * GYRI_CELL}
                y={r * GYRI_CELL}
                width={GYRI_CELL}
                height={GYRI_CELL}
                fill={color}
                fillOpacity={0.075}
              />
            ))}
          </G>
        </Pattern>
      </Defs>
    );
  }
  return null;
}

export const BACKDROP_FILL = `url(#${ID})`;
