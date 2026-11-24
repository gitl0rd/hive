// Native (Android / iOS): real haptics through expo-haptics. Web build: see haptics.web.ts.
import * as Haptics from 'expo-haptics';

export type HapticKind = 'tap' | 'medium' | 'heavy';

const STYLE = {
  tap: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

/** One haptic bump. Never throws. */
export function haptic(kind: HapticKind): void {
  Haptics.impactAsync(STYLE[kind]).catch(() => {});
}
