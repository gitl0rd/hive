import { G, Rect } from 'react-native-svg';

import { colors } from './theme';

/** Pixel bee on an 11×7 grid, facing right. Drawn inside an <Svg>. */
export const BEE_GRID = { w: 11, h: 7 } as const;

interface Props {
  /** Centre of the bee in the parent's coordinates */
  x: number;
  y: number;
  /** Size of one pixel */
  px: number;
  /** Mirror horizontally (flying left) */
  flip?: boolean;
  color?: string;
}

export function PixelBee({ x, y, px, flip = false, color = colors.screen }: Props) {
  const w = BEE_GRID.w * px;
  const h = BEE_GRID.h * px;
  const transform = flip
    ? `translate(${x + w / 2} ${y - h / 2}) scale(${-px} ${px})`
    : `translate(${x - w / 2} ${y - h / 2}) scale(${px})`;
  return (
    <G transform={transform} testID="pixel-bee">
      {/* glow halo */}
      <Rect x={0.5} y={1.5} width={10} height={6} fill={color} opacity={0.12} />
      {/* wings */}
      <Rect x={3} y={0} width={2} height={2} fill={color} opacity={0.55} />
      <Rect x={6} y={0} width={2} height={2} fill={color} opacity={0.55} />
      {/* body with two stripes */}
      <Rect x={1} y={2} width={8} height={5} fill={color} />
      <Rect x={3} y={2} width={1} height={5} fill={colors.bg} />
      <Rect x={6} y={2} width={1} height={5} fill={colors.bg} />
      {/* head + eye */}
      <Rect x={9} y={3} width={2} height={3} fill={color} />
      <Rect x={10} y={4} width={1} height={1} fill={colors.bg} />
      {/* stinger */}
      <Rect x={0} y={4} width={1} height={1} fill={color} />
    </G>
  );
}
