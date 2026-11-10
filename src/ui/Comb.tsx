import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
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
import { itemColor, type ThemeTokens } from '../themes';
import { PixelBee } from './PixelBee';
import { DISPLAY_CHAR_WIDTH_EM, fonts, type SizeSet } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';
import type { SpinView } from './useBoard';

export interface CombProps {
  flowers: Flower[];
  layout: BoardLayout;
  excluded: ReadonlySet<string>;
  size: SizeSet;
  spin?: SpinView;
  /** Shown instead of the board (e.g. no flowers) */
  emptyMessage?: string;
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
export function Comb({
  flowers,
  layout,
  excluded,
  size,
  spin = IDLE_VIEW,
  emptyMessage,
}: CombProps) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
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

  const beeW = t.theme.sprite.w * size.beePx;
  const beeH = t.theme.sprite.h * size.beePx;
  const reserveForBee = beeH + 16;
  const { bounds } = board;
  const bw = bounds.width + size.boardPad * 2;
  const bh = bounds.height + size.boardPad * 2;
  const scale = fitScale({ ...bounds, width: bw, height: bh }, area.w, area.h - reserveForBee);
  const ox = (area.w - bw * scale) / 2 - (bounds.minX - size.boardPad) * scale;
  const oy = (area.h - reserveForBee - bh * scale) / 2 - (bounds.minY - size.boardPad) * scale;

  const center = (i: number): Point => cellCenter(layout.cells[i], size.cellWidth);
  const text = labelMetrics(size, scale);
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
    <View
      style={styles.fill}
      onLayout={onLayout}
      testID="comb"
      accessible
      accessibilityRole="image"
      accessibilityLabel={combSummary(flowers, excluded, spin, layout, t)}
    >
      {emptyMessage ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : null}
      {area.w > 0 && area.h > 0 && !emptyMessage ? (
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
                  t={t}
                  text={text}
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
              const color = itemColor(e.color, f.source === 'hive', t);
              return (
                <G key={`${e.cellIndex}-${e.dir}`} opacity={dim ? 0.3 : 1}>
                  <Line
                    x1={p.x}
                    y1={p.y}
                    x2={q.x}
                    y2={q.y}
                    stroke={color}
                    strokeWidth={size.edge * 3}
                    strokeOpacity={0.22}
                    strokeLinecap="round"
                  />
                  <Line
                    x1={p.x}
                    y1={p.y}
                    x2={q.x}
                    y2={q.y}
                    stroke={color}
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
              stroke={t.trailA(1)}
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

/** What a screen reader hears for the board (the SVG itself is decoration). */
function combSummary(
  flowers: Flower[],
  excluded: ReadonlySet<string>,
  spin: SpinView,
  layout: BoardLayout,
  t: ThemeTokens,
): string {
  const w = t.theme.words;
  if (spin.phase === 'flying') return `${w.a11y.comb}. ${w.a11y.inFlight}.`;
  if (spin.phase === 'landed' && spin.winner >= 0) {
    const f = flowers.find((x) => x.id === layout.cells[spin.winner]?.flowerId);
    if (f) return `${w.a11y.comb}. ${w.a11y.landedOn(f.title, f.projectName)}`;
  }
  const on = flowers.filter((f) => !excluded.has(f.id) && !f.goneFromTodoist).length;
  return `${w.a11y.comb} with ${flowers.length} ${flowers.length === 1 ? w.item : w.items}, ${on} in today's spin.`;
}

type CellState = 'idle' | 'bee' | 'winner';

export interface LabelMetrics {
  label: number;
  late: number;
  maxLines: number;
}

/** On-screen label size never drops below this (px), however much the board shrinks. */
export const MIN_LABEL_PX = 10;

/**
 * Busy boards shrink, so labels are enlarged (in board units) to stay readable on screen, and
 * get fewer lines (more truncation) instead. Late tags follow the same rule.
 */
export function labelMetrics(size: SizeSet, scale: number): LabelMetrics {
  const s = scale > 0 ? scale : 1;
  const maxLabel = size.cellWidth / 4.2; // keeps at least ~6 chars per line
  const label = Math.min(maxLabel, Math.max(size.label, MIN_LABEL_PX / s));
  const late = Math.min(maxLabel * 0.8, Math.max(size.late, (MIN_LABEL_PX * 0.8) / s));
  const grown = label / size.label;
  const maxLines = grown > 1.6 ? 1 : grown > 1.15 ? 2 : 3;
  return { label, late, maxLines };
}

function Cell({
  t,
  text,
  flower,
  center,
  size,
  opacity,
  struck,
  state,
}: {
  t: ThemeTokens;
  text: LabelMetrics;
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
  const charW = text.label * DISPLAY_CHAR_WIDTH_EM;
  const maxChars = Math.max(3, Math.floor((size.cellWidth - size.labelPadX * 2) / charW));
  const lines = wrapLabel(
    flower.title.toUpperCase(),
    maxChars,
    late ? Math.max(1, Math.min(2, text.maxLines - (text.maxLines > 1 ? 1 : 0))) : text.maxLines,
  );
  const lh = text.label * 0.95;
  const lateGap = late ? text.late * 1.05 : 0;
  const blockH = lines.length * lh + lateGap;
  const top = center.y - blockH / 2;

  const isWin = state === 'winner';
  const textColor = isWin ? t.bg : t.screen;
  const fill = isWin ? t.screen : state === 'bee' ? t.beeCell : t.bg;
  const stroke = state === 'idle' ? t.dimRing : t.screen;

  return (
    <G opacity={opacity}>
      {isWin ? (
        <Polygon points={pts} fill="none" stroke={t.screen} strokeWidth={16} strokeOpacity={0.25} />
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
                fontSize={text.label}
                textAnchor="middle"
                fill="none"
                stroke={t.a(0.35)}
                strokeWidth={3}
              >
                {ln}
              </SvgText>
            )}
            <SvgText
              x={center.x}
              y={y}
              fontFamily={fonts.display}
              fontSize={text.label}
              textAnchor="middle"
              fill={textColor}
            >
              {ln}
            </SvgText>
            {struck ? (
              <Line
                x1={center.x - (ln.length * charW) / 2}
                x2={center.x + (ln.length * charW) / 2}
                y1={y - text.label * 0.3}
                y2={y - text.label * 0.3}
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
          y={top + lines.length * lh + text.late * 0.95}
          fontFamily={fonts.display}
          fontSize={text.late}
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

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    fill: { flex: 1, alignSelf: 'stretch', minHeight: 120 },
    empty: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    emptyText: {
      fontFamily: fonts.display,
      fontSize: 24,
      letterSpacing: 2,
      color: t.screen,
      opacity: 0.8,
      textAlign: 'center',
      textShadowColor: t.a(0.55),
      textShadowRadius: 6,
    },
  });
