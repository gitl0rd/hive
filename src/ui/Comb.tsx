import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { layoutItems } from '../domain/board';
import { projectEdges } from '../domain/edges';
import {
  boardBounds,
  cellCenter,
  fitScale,
  hexCorners,
  layoutBoard,
  type Point,
  sideSegment,
} from '../domain/hexLayout';
import { lateTag, wrapLabel } from '../domain/labels';
import type { Flower } from '../domain/types';
import { BEE_GRID, PixelBee } from './PixelBee';
import { a, colors, DISPLAY_CHAR_WIDTH_EM, fonts, type SizeSet } from './theme';

export interface CombProps {
  flowers: Flower[];
  excluded: ReadonlySet<string>;
  seed: number;
  size: SizeSet;
}

/** Edges sit slightly inside the cell, like the design (so two projects' borders sit side by side). */
const EDGE_INSET = 0.9;

/**
 * The honeycomb board. Fills its parent; the board is centred and scaled down to fit (never up).
 * The bee rests at the bottom centre, just above the spin bar.
 */
export function Comb({ flowers, excluded, seed, size }: CombProps) {
  const [area, setArea] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== area.w || height !== area.h) setArea({ w: width, h: height });
  };

  const board = useMemo(() => {
    const layout = layoutBoard(seed, layoutItems(flowers));
    const byId = new Map(flowers.map((f) => [f.id, f]));
    const edges = projectEdges(layout, byId);
    const b = boardBounds(layout, size.cellWidth);
    return { layout, byId, edges, bounds: b };
  }, [flowers, seed, size.cellWidth]);

  const beeH = BEE_GRID.h * size.beePx;
  const reserveForBee = beeH + 16;
  const { bounds } = board;
  const bw = bounds.width + size.boardPad * 2;
  const bh = bounds.height + size.boardPad * 2;
  const scale = fitScale({ ...bounds, width: bw, height: bh }, area.w, area.h - reserveForBee);
  const ox = (area.w - bw * scale) / 2 - (bounds.minX - size.boardPad) * scale;
  const oy = (area.h - reserveForBee - bh * scale) / 2 - (bounds.minY - size.boardPad) * scale;

  const center = (i: number): Point => cellCenter(board.layout.cells[i], size.cellWidth);
  const isDim = (f: Flower) => excluded.has(f.id) || !!f.goneFromTodoist;

  return (
    <View style={styles.fill} onLayout={onLayout} testID="comb">
      {area.w > 0 && area.h > 0 ? (
        <Svg width={area.w} height={area.h}>
          <G transform={`translate(${ox} ${oy}) scale(${scale})`}>
            {board.layout.cells.map((cell, i) => {
              const f = board.byId.get(cell.flowerId);
              if (!f) return null;
              return (
                <Cell
                  key={f.id}
                  flower={f}
                  center={center(i)}
                  size={size}
                  dim={isDim(f)}
                  struck={excluded.has(f.id)}
                />
              );
            })}
            {board.edges.map((e) => {
              const f = board.byId.get(board.layout.cells[e.cellIndex].flowerId)!;
              const c = center(e.cellIndex);
              const [p, q] = sideSegment(c, size.cellWidth, e.dir).map((pt) => ({
                x: c.x + (pt.x - c.x) * EDGE_INSET,
                y: c.y + (pt.y - c.y) * EDGE_INSET,
              }));
              const op = isDim(f) ? 0.3 : 1;
              return (
                <G key={`${e.cellIndex}-${e.dir}`} opacity={op}>
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
          <PixelBee x={area.w / 2} y={area.h - beeH / 2 - 6} px={size.beePx} />
        </Svg>
      ) : null}
    </View>
  );
}

function Cell({
  flower,
  center,
  size,
  dim,
  struck,
}: {
  flower: Flower;
  center: Point;
  size: SizeSet;
  dim: boolean;
  struck: boolean;
}) {
  const corners = hexCorners(center, size.cellWidth);
  // Inset ring so the 1.5px stroke stays inside the cell
  const ring = corners.map((p) => ({
    x: center.x + (p.x - center.x) * 0.985,
    y: center.y + (p.y - center.y) * 0.985,
  }));
  const late = lateTag(flower.daysLate);
  const charW = size.label * DISPLAY_CHAR_WIDTH_EM;
  const maxChars = Math.max(3, Math.floor((size.cellWidth - size.labelPadX * 2) / charW));
  const lines = wrapLabel(flower.title.toUpperCase(), maxChars, late ? 2 : 3);
  const lh = size.label * 0.95;
  const lateGap = late ? size.late * 1.05 : 0;
  const blockH = lines.length * lh + lateGap;
  const top = center.y - blockH / 2;

  return (
    <G opacity={dim ? 0.3 : 1}>
      <Polygon
        points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={colors.bg}
        stroke={colors.dimRing}
        strokeWidth={1.5}
      />
      {lines.map((ln, k) => {
        const y = top + lh * (k + 0.78);
        return (
          <G key={k}>
            {/* soft glow underlay */}
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
            <SvgText
              x={center.x}
              y={y}
              fontFamily={fonts.display}
              fontSize={size.label}
              textAnchor="middle"
              fill={colors.screen}
            >
              {ln}
            </SvgText>
            {struck ? (
              <Line
                x1={center.x - (ln.length * charW) / 2}
                x2={center.x + (ln.length * charW) / 2}
                y1={y - size.label * 0.3}
                y2={y - size.label * 0.3}
                stroke={colors.screen}
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
          fill={colors.screen}
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
