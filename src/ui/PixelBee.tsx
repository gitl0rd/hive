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
  const runs = spriteRuns(sprite);
  return (
    <G transform={transform} testID="pixel-bee">
      {/* glow halo: the sprite's own outline, one pixel wider. Group opacity so overlaps don't stack. */}
      <G opacity={0.12}>
        {runs.map((r) => (
          <Rect
            key={`h${r.x}-${r.y}`}
            x={r.x - 0.5}
            y={r.y - 0.5}
            width={r.w + 1}
            height={2}
            fill={body}
          />
        ))}
      </G>
      {runs.map((r) => (
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
