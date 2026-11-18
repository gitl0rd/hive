import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  type CoinFlipPlan,
  coinPose,
  type CoinPose,
  type CoinSide,
  planFlip,
  restingPose,
} from '../domain/coin';
import {
  type CoinLabels,
  EMPTY_COIN_LABELS,
  loadCoinLabels,
  saveCoinLabels,
} from '../store/coinLabels';

export interface CoinModel {
  pose: CoinPose;
  flipping: boolean;
  /** Last landed side, null before the first flip */
  result: CoinSide | null;
  /** Recent results, newest first (this session only) */
  recent: CoinSide[];
  flip: () => void;
  labels: CoinLabels;
  setLabel: (side: CoinSide, text: string) => void;
  clearLabels: () => void;
}

const RECENT_MAX = 12;

/** Plays a coin flip (domain/coin.ts) frame by frame and keeps the side labels. */
export function useCoin({
  reducedMotion = false,
  haptics = true,
}: { reducedMotion?: boolean; haptics?: boolean } = {}): CoinModel {
  const [up, setUp] = useState<CoinSide>('heads');
  const [plan, setPlan] = useState<CoinFlipPlan | null>(null);
  const [t, setT] = useState(0);
  const [result, setResult] = useState<CoinSide | null>(null);
  const [recent, setRecent] = useState<CoinSide[]>([]);
  const [labels, setLabels] = useState<CoinLabels>(EMPTY_COIN_LABELS);
  const loaded = useRef(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadCoinLabels().then((l) => {
      if (!alive) return;
      loaded.current = true;
      // Keep anything typed before storage answered.
      setLabels((cur) => (cur.heads || cur.tails ? cur : l));
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loaded.current) saveCoinLabels(labels).catch(() => {});
  }, [labels]);

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };
  useEffect(() => stop, []);

  const land = useCallback(
    (side: CoinSide) => {
      setPlan(null);
      setUp(side);
      setResult(side);
      setRecent((r) => [side, ...r].slice(0, RECENT_MAX));
      if (haptics && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    },
    [haptics],
  );

  const flip = useCallback(() => {
    if (plan) return;
    const next = planFlip(Math.random, up);
    if (reducedMotion) {
      land(next.side);
      return;
    }
    stop();
    setPlan(next);
    setT(0);
    setResult(null);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= next.durationMs) {
        frame.current = null;
        land(next.side);
        return;
      }
      setT(elapsed);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [plan, up, reducedMotion, land]);

  return {
    pose: plan ? coinPose(plan, t) : restingPose(up),
    flipping: plan !== null,
    result,
    recent,
    flip,
    labels,
    setLabel: (side, text) => setLabels((l) => ({ ...l, [side]: text })),
    clearLabels: () => setLabels(EMPTY_COIN_LABELS),
  };
}
