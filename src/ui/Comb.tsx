import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { G, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { projectEdges } from '../domain/edges';
import {
  type BoardLayout,
  boardBounds,
  cellCenter,
  fitScale,
  hexCorners,
  type Point,
  sideSegment,
} from '../domain/hexLayout';
import { lateTag, wrapLabel } from '../domain/labels';
import { SPIN } from '../domain/spinPlan';
import type { Flower } from '../domain/types';
import { BEE_GRID, PixelBee } from './PixelBee';
import { a, colors, DISPLAY_CHAR_WIDTH_EM, fonts, type SizeSet } from './theme';
import type { SpinView } from './useBoard';

export interface CombProps {
  flowers: Flower[];
  layout: BoardLayout;
  excluded: ReadonlySet<string>;
  size: SizeSet;
  spin?: SpinView;
}

const IDLE_VIEW: SpinView = {
  phase: 'idle',
  bee: { from: -1, to: -1, step: 6 },
  trail: [],
  winner: -1,
};

/** Edges sit slightly inside the cell, like the design (so two projects' borders sit side by side). */
const EDGE_INSET = 0.9;

/**
 * The honeycomb board. Fills its parent; the board is centred and scaled down to fit (never up).
 * The bee rests at the bottom centre, just above the spin bar, and keeps its size whatever the
 * board's scale.
 */
export function Comb({ flowers, layout, excluded, size, spin = IDLE_VIEW }: CombProps) {
  const [area, setArea] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== area.w || height !== area.h) setArea({ w: width, h: height });
  };

  const board = useMemo(() => {
    const byId = new Map(flowers.map((f) => [f.id, f]));
    const edges = projectEdges(layout, byId);
    const b = boardBounds(layout, size.cellWidth);
    return { byId, edges, bounds: b };
  }, [flowers, layout, size.cellWidth]);

  const beeW = BEE_GRID.w * size.beePx;
  const beeH = BEE_GRID.h * size.beePx;
  const reserveForBee = beeH + 16;
  const { bounds } = board;
  const bw = bounds.width + size.boardPad * 2;
  const bh = bounds.height + size.boardPad * 2;
  const scale = fitScale({ ...bounds, width: bw, height: bh }, area.w, area.h - reserveForBee);
  const ox = (area.w - bw * scale) / 2 - (bounds.minX - size.boardPad) * scale;
  const oy = (area.h - reserveForBee - bh * scale) / 2 - (bounds.minY - size.boardPad) * scale;

  const center = (i: number): Point => cellCenter(layout.cells[i], size.cellWidth);
  const home: Point = { x: area.w / 2, y: area.h - beeH / 2 - 6 };
  const toScreen = (i: number): Point => {
    if (i < 0 || i >= layout.cells.length) return home;
    const c = center(i);
    return { x: ox + c.x * scale, y: oy + c.y * scale };
  };

  const landed = spin.phase === 'landed';
  const flying = spin.phase === 'flying';

  // Bee position: stepped interpolation in screen space; perched beside the winner once landed.
  let bee = home;
  let flip = false;
  if (flying) {
    const p0 = toScreen(spin.bee.from);
    const p1 = toScreen(spin.bee.to);
    const t = spin.bee.step / SPIN.steps;
    bee = { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
    flip = p1.x < p0.x - 0.5;
  } else if (landed && spin.winner >= 0) {
    const w = toScreen(spin.winner);
    bee = {
      x: w.x + size.cellWidth * 0.23 * scale + beeW * 0.15,
      y: w.y - size.cellWidth * 0.36 * scale - beeH * 0.2,
    };
  }

  // Trail: dotted line through the last hops (starting from home on the first ones).
  const trailPts = flying
    ? [-1, ...spin.trail].slice(-(spin.trail.length >= 6 ? 6 : spin.trail.length + 1))
    : [];
  const trailSegs = trailPts
    .slice(1)
    .map((cell, k) => ({ p: toScreen(trailPts[k]), q: toScreen(cell), k }));

  const isDim = (f: Flower) => excluded.has(f.id) || !!f.goneFromTodoist;

  return (
    <View style={styles.fill} onLayout={onLayout} testID="comb">
      {area.w > 0 && area.h > 0 ? (
        <Svg width={area.w} height={area.h}>
          <G transform={`translate(${ox} ${oy}) scale(${scale})`}>
            {layout.cells.map((cell, i) => {
              const f = board.byId.get(cell.flowerId);
              if (!f) return null;
              const isWin = landed && spin.winner === i;
              const here = flying && spin.bee.to === i && spin.bee.step > 0;
              const opacity = isDim(f) ? 0.3 : landed && !isWin ? 0.45 : 1;
              return (
                <Cell
                  key={f.id}
                  flower={f}
                  center={center(i)}
                  size={size}
                  opacity={opacity}
                  struck={excluded.has(f.id)}
                  state={isWin ? 'winner' : here ? 'bee' : 'idle'}
                />
              );
            })}
            {board.edges.map((e) => {
              const f = board.byId.get(layout.cells[e.cellIndex].flowerId)!;
              const c = center(e.cellIndex);
              const [p, q] = sideSegment(c, size.cellWidth, e.dir).map((pt) => ({
                x: c.x + (pt.x - c.x) * EDGE_INSET,
                y: c.y + (pt.y - c.y) * EDGE_INSET,
              }));
              const dim = isDim(f) || (landed && spin.winner !== e.cellIndex);
              return (
                <G key={`${e.cellIndex}-${e.dir}`} opacity={dim ? 0.3 : 1}>
                  <Line
                    x1={p.x}
                    y1={p.y}
                    x2={q.x}
                    y2={q.y}
                    stroke={e.color}
                    strokeWidth={size.edge * 3}
                    strokeOpacity={0.22}
                    strokeLinecap="round"
                  />
                  <Line
                    x1={p.x}
                    y1={p.y}
                    x2={q.x}
                    y2={q.y}
                    stroke={e.color}
                    strokeWidth={size.edge}
                  />
                </G>
              );
            })}
          </G>
          {trailSegs.map(({ p, q, k }) => (
            <Polyline
              key={`trail-${k}`}
              points={`${p.x},${p.y} ${q.x},${q.y}`}
              stroke={colors.screen}
              strokeOpacity={0.2 + (0.7 * (k + 1)) / trailSegs.length}
              strokeWidth={3}
              strokeDasharray="0.1 7"
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <PixelBee x={bee.x} y={bee.y} px={size.beePx} flip={flip} />
        </Svg>
      ) : null}
    </View>
  );
}

type CellState = 'idle' | 'bee' | 'winner';

function Cell({
  flower,
  center,
  size,
  opacity,
  struck,
  state,
}: {
  flower: Flower;
  center: Point;
  size: SizeSet;
  opacity: number;
  struck: boolean;
  state: CellState;
}) {
  const corners = hexCorners(center, size.cellWidth);
  // Inset ring so the 1.5px stroke stays inside the cell
  const ring = corners.map((p) => ({
    x: center.x + (p.x - center.x) * 0.985,
    y: center.y + (p.y - center.y) * 0.985,
  }));
  const pts = ring.map((p) => `${p.x},${p.y}`).join(' ');
  const late = lateTag(flower.daysLate);
  const charW = size.label * DISPLAY_CHAR_WIDTH_EM;
  const maxChars = Math.max(3, Math.floor((size.cellWidth - size.labelPadX * 2) / charW));
  const lines = wrapLabel(flower.title.toUpperCase(), maxChars, late ? 2 : 3);
  const lh = size.label * 0.95;
  const lateGap = late ? size.late * 1.05 : 0;
  const blockH = lines.length * lh + lateGap;
  const top = center.y - blockH / 2;

  const isWin = state === 'winner';
  const textColor = isWin ? colors.bg : colors.screen;
  const fill = isWin ? colors.screen : state === 'bee' ? '#2A1A05' : colors.bg; // bee: screen @ ~14% over bg
  const stroke = state === 'idle' ? colors.dimRing : colors.screen;

  return (
    <G opacity={opacity}>
      {isWin ? (
        <Polygon
          points={pts}
          fill="none"
          stroke={colors.screen}
          strokeWidth={16}
          strokeOpacity={0.25}
        />
      ) : null}
      <Polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.map((ln, k) => {
        const y = top + lh * (k + 0.78);
        return (
          <G key={k}>
            {isWin ? null : (
              <SvgText
                x={center.x}
                y={y}
                fontFamily={fonts.display}
                fontSize={size.label}
                textAnchor="middle"
                fill="none"
                stroke={a(0.35)}
                strokeWidth={3}
              >
                {ln}
              </SvgText>
            )}
            <SvgText
              x={center.x}
              y={y}
              fontFamily={fonts.display}
              fontSize={size.label}
              textAnchor="middle"
              fill={textColor}
            >
              {ln}
            </SvgText>
            {struck ? (
              <Line
                x1={center.x - (ln.length * charW) / 2}
                x2={center.x + (ln.length * charW) / 2}
                y1={y - size.label * 0.3}
                y2={y - size.label * 0.3}
                stroke={textColor}
                strokeWidth={1.5}
              />
            ) : null}
          </G>
        );
      })}
      {late ? (
        <SvgText
          x={center.x}
          y={top + lines.length * lh + size.late * 0.95}
          fontFamily={fonts.display}
          fontSize={size.late}
          textAnchor="middle"
          fill={textColor}
          opacity={0.8}
        >
          {late}
        </SvgText>
      ) : null}
    </G>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch', minHeight: 120 },
});
