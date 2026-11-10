import Svg, { Rect } from 'react-native-svg';

import { colors } from './theme';

// 11x11 pixel cog: eight teeth around a ring with a hole, same pixel style as the bee.
const COG = [
  '....XXX....',
  '.XX.XXX.XX.',
  '.XXXXXXXXX.',
  '..XXXXXXX..',
  'XXXX...XXXX',
  'XXXX...XXXX',
  'XXXX...XXXX',
  '..XXXXXXX..',
  '.XXXXXXXXX.',
  '.XX.XXX.XX.',
  '....XXX....',
];

/** Settings cog, `size` px square, crisp pixels. Decorative: label the button around it. */
export function PixelCog({ size = 18, color = colors.screen }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 11 11"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {COG.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === 'X' ? (
            <Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
          ) : null,
        ),
      )}
    </Svg>
  );
}
