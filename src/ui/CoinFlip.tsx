import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, G, Rect } from 'react-native-svg';

import { type CoinSide, tally } from '../domain/coin';
import { pad2 } from '../domain/labels';
import { COIN_LABEL_MAX } from '../store/coinLabels';
import type { ThemeTokens } from '../themes';
import { pixelFill, type Sprite, spriteRuns } from '../themes/sprites';
import { TermButton } from './Button';
import { fonts } from './theme';
import { useTheme, useThemedStyles } from './ThemeContext';
import type { CoinModel } from './useCoin';

const SIDE_WORD: Record<CoinSide, string> = { heads: 'HEADS', tails: 'TAILS' };

/** How the coin and its result read to a person (and a screen reader). */
export function sideText(side: CoinSide, label: string): string {
  const l = label.trim();
  return l ? `${SIDE_WORD[side]} · ${l.toUpperCase()}` : SIDE_WORD[side];
}

/**
 * COIN: a pixel coin that flips end over end and lands heads or tails. Each side can stand for
 * something (typed below); blank shows the theme's icons (its second mascot / its sprite).
 */
export function CoinPanel({
  coin,
  fontSize = 22,
  buttonHeight = 58,
  buttonFontSize = 30,
  compact = false,
}: {
  coin: CoinModel;
  fontSize?: number;
  buttonHeight?: number;
  buttonFontSize?: number;
  /** Short window (desktop side column): both label inputs on one row */
  compact?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const th = useTheme();
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== stage.w || height !== stage.h) setStage({ w: width, h: height });
  };
  const { pose, flipping, result, recent, labels } = coin;
  const counts = tally(recent);

  // Coin size: fits the stage with room to rise. The toss goes up ~ one coin and grows 25%.
  const D = Math.max(60, Math.min(220, stage.w * 0.62, stage.h / (compact ? 1.7 : 2.05)));
  const rise = Math.max(0, stage.h - D * 1.3 - 12);
  const scale = 1 + 0.25 * pose.lift;
  const thick = D * 0.07;
  const rim = Math.sqrt(Math.max(0, 1 - pose.squash * pose.squash));
  const showing = sideText(pose.face, labels[pose.face]);

  return (
    <View style={styles.root}>
      <Pressable
        style={[styles.stage, { minHeight: compact ? 120 : 200 }]}
        onLayout={onLayout}
        onPress={coin.flip}
        disabled={flipping}
        accessibilityRole="button"
        accessibilityLabel={flipping ? 'Coin in the air' : `Coin showing ${showing}. Tap to flip.`}
        testID="coin-stage"
      >
        {stage.w > 0 ? (
          <>
            {/* Shadow on the table: shrinks and fades as the coin rises */}
            <View
              pointerEvents="none"
              style={[
                styles.shadow,
                {
                  width: D * (0.9 - 0.4 * pose.lift),
                  height: D * 0.12,
                  left: (stage.w - D * (0.9 - 0.4 * pose.lift)) / 2,
                  opacity: 0.35 - 0.25 * pose.lift,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: D,
                height: D,
                left: (stage.w - D) / 2,
                bottom: D * 0.06 + 6,
                transform: [{ translateY: -rise * pose.lift }, { scale }],
              }}
            >
              {/* Rim: a second disc behind the face, offset to the side the edge shows on */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { transform: [{ translateY: pose.edge * thick * rim }, { scaleY: pose.squash }] },
                ]}
              >
                <Svg width={D} height={D} viewBox="0 0 100 100">
                  <Circle cx={50} cy={50} r={48} fill={th.screen} opacity={0.55} />
                </Svg>
              </View>
              <View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: pose.squash }] }]}>
                <CoinFace side={pose.face} label={labels[pose.face]} size={D} />
              </View>
            </View>
          </>
        ) : null}
      </Pressable>

      <View style={styles.resultRow} accessibilityLiveRegion="polite">
        <Text
          style={[styles.result, { fontSize: fontSize + 8 }, result ? styles.resultOn : null]}
          numberOfLines={1}
        >
          {flipping
            ? '◌ IN THE AIR …'
            : result
              ? `> ${sideText(result, labels[result])}`
              : '> READY'}
        </Text>
        <Text style={[styles.tally, { fontSize: fontSize - 6 }]} numberOfLines={1}>
          {recent.length > 0
            ? `H ${pad2(counts.heads)} · T ${pad2(counts.tails)}   ${recent
                .map((r) => (r === 'heads' ? 'H' : 'T'))
                .join(' ')}`
            : 'TAP THE COIN OR FLIP'}
        </Text>
      </View>

      <View style={compact ? styles.inputsCompact : styles.inputs}>
        {(['heads', 'tails'] as const).map((side) => (
          <View key={side} style={[styles.inputRow, compact ? styles.inputRowCompact : null]}>
            <Text style={[styles.prompt, { fontSize }]}>{`> ${SIDE_WORD[side]}:`}</Text>
            <TextInput
              value={labels[side]}
              onChangeText={(v) => coin.setLabel(side, v)}
              placeholder="(icon)"
              placeholderTextColor={th.a(0.4)}
              maxLength={COIN_LABEL_MAX}
              accessibilityLabel={`${SIDE_WORD[side].toLowerCase()} stands for`}
              returnKeyType="done"
              style={[styles.input, { fontSize }]}
              testID={`coin-${side}-input`}
            />
          </View>
        ))}
      </View>
      {labels.heads || labels.tails ? (
        <Pressable
          onPress={coin.clearLabels}
          accessibilityRole="button"
          accessibilityLabel="Clear coin labels"
          style={styles.clear}
        >
          <Text style={[styles.clearText, { fontSize: fontSize - 4 }]}>[CLEAR]</Text>
        </Pressable>
      ) : null}

      <TermButton
        label={flipping ? '◌ IN THE AIR …' : '▶ FLIP'}
        glowBox={!flipping}
        disabled={flipping}
        onPress={coin.flip}
        height={buttonHeight}
        fontSize={buttonFontSize}
        style={styles.flip}
        accessibilityLabel={flipping ? 'Coin in the air' : 'Flip coin'}
      />
    </View>
  );
}

/** One face of the coin, flat (the parent squashes it). viewBox 100×100. */
function CoinFace({ side, label, size }: { side: CoinSide; label: string; size: number }) {
  const th = useTheme();
  const text = label.trim().toUpperCase();
  const sprite: Sprite = side === 'heads' ? th.theme.coinHeads : th.theme.sprite;
  const k = size / 100;
  const labelSize = (text.length <= 6 ? 22 : text.length <= 14 ? 16 : 12) * k;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={48} fill={th.bg} stroke={th.screen} strokeWidth={3.5} />
        <Circle
          cx={50}
          cy={50}
          r={41}
          fill="none"
          stroke={th.screen}
          strokeWidth={1.2}
          strokeDasharray="2 2.6"
          opacity={0.7}
        />
        {/* soft inner glow */}
        <Circle cx={50} cy={50} r={45} fill={th.screen} opacity={0.07} />
        {text ? null : (
          <SpriteAt
            sprite={sprite}
            cx={50}
            cy={side === 'heads' ? 44 : 46}
            // heads: same pixel size for every theme's mascot (the 11-wide head spans 34)
            span={side === 'heads' ? (sprite.w * 34) / 11 : 44}
          />
        )}
      </Svg>
      {text ? (
        <View style={[StyleSheet.absoluteFill, faceStyles.labelBox]} pointerEvents="none">
          <Text
            numberOfLines={3}
            style={{
              fontFamily: fonts.display,
              fontSize: labelSize,
              lineHeight: labelSize * 1.0,
              color: th.screen,
              textAlign: 'center',
              letterSpacing: 1,
              ...th.glow,
            }}
          >
            {text}
          </Text>
        </View>
      ) : null}
      <View style={[StyleSheet.absoluteFill, faceStyles.sideBox]} pointerEvents="none">
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 11 * k,
            letterSpacing: 2 * k,
            color: th.screen,
            opacity: 0.8,
          }}
        >
          {SIDE_WORD[side]}
        </Text>
      </View>
    </View>
  );
}

/** Pixel sprite centred at (cx, cy), `span` units wide, in an SVG. */
function SpriteAt({
  sprite,
  cx,
  cy,
  span,
}: {
  sprite: Sprite;
  cx: number;
  cy: number;
  span: number;
}) {
  const th = useTheme();
  const px = span / sprite.w;
  const ink = { B: th.screen, W: th.wing, s: th.bg };
  return (
    <G
      transform={`translate(${cx - (sprite.w * px) / 2} ${cy - (sprite.h * px) / 2}) scale(${px})`}
    >
      {spriteRuns(sprite).map((r) => (
        <Rect
          key={`${r.x}-${r.y}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={pixelFill(sprite, r.kind, ink)}
          opacity={r.kind === 'W' ? sprite.wingOpacity : undefined}
        />
      ))}
    </G>
  );
}

const faceStyles = StyleSheet.create({
  labelBox: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: '17%' },
  sideBox: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '13%' },
});

const makeStyles = (t: ThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, minHeight: 0, gap: 8 },
    stage: { flex: 1, position: 'relative', overflow: 'hidden' },
    shadow: {
      position: 'absolute',
      bottom: 2,
      borderRadius: 999,
      backgroundColor: t.screen,
    },
    resultRow: { alignItems: 'center', gap: 2 },
    result: {
      fontFamily: fonts.display,
      letterSpacing: 2,
      color: t.screen,
      paddingHorizontal: 10,
      ...t.glow,
    },
    resultOn: { backgroundColor: t.screen, color: t.bg, ...t.noGlow },
    tally: { fontFamily: fonts.body, color: t.dimText, letterSpacing: 1 },
    inputs: { gap: 8 },
    inputsCompact: { flexDirection: 'row', gap: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputRowCompact: { flex: 1, minWidth: 0 },
    prompt: { fontFamily: fonts.display, color: t.screen, letterSpacing: 1, ...t.glow },
    input: {
      flex: 1,
      minWidth: 0,
      height: 36,
      borderBottomWidth: 2,
      borderBottomColor: t.a(0.5),
      color: t.screen,
      fontFamily: fonts.display,
      paddingHorizontal: 4,
      ...t.glow,
    },
    clear: { position: 'absolute', top: 0, right: 0, padding: 4 },
    clearText: { fontFamily: fonts.display, color: t.dimText, letterSpacing: 1 },
    flip: { marginHorizontal: 18, marginTop: 8, marginBottom: 6 },
  });
