import { G, Rect } from 'react-native-svg';

import { type Sprite, spriteRuns } from '../themes/sprites';
import { useTheme } from './ThemeContext';

interface Props {
  /** Centre of the sprite in the parent's coordinates */
  x: number;
  y: number;
  /** Size of one pixel */
  px: number;
  /** Mirror horizontally (flying left) */
  flip?: boolean;
  color?: string;
}

/** The theme's pixel sprite (bee, brain …), facing right. Drawn inside an <Svg>. */
export function PixelBee({ x, y, px, flip = false, color }: Props) {
  const t = useTheme();
  const sprite: Sprite = t.theme.sprite;
  const body = color ?? t.screen;
  const w = sprite.w * px;
  const h = sprite.h * px;
  const transform = flip
    ? `translate(${x + w / 2} ${y - h / 2}) scale(${-px} ${px})`
    : `translate(${x - w / 2} ${y - h / 2}) scale(${px})`;
  const fill = { B: body, W: t.wing, s: t.bg } as const;
  return (
    <G transform={transform} testID="pixel-bee">
      {/* glow halo */}
      <Rect x={0.5} y={1.5} width={sprite.w - 1} height={sprite.h - 1} fill={body} opacity={0.12} />
      {spriteRuns(sprite).map((r) => (
        <Rect
          key={`${r.x}-${r.y}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={fill[r.kind]}
          opacity={r.kind === 'W' ? sprite.wingOpacity : undefined}
        />
      ))}
    </G>
  );
}
