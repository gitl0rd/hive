// Web build haptics. Never throws; does nothing where the browser offers no way.
//
// - Browsers with the Vibration API (Android Chrome): navigator.vibrate.
// - iOS Safari (18+) has no Vibration API, but flipping a native <input type="checkbox" switch>
//   plays the system "switch" tick. We keep a hidden one and click its label. It's always the same
//   light tick (no strengths), and iOS only plays it straight after a real touch, so the delayed
//   landing bump may be silent. Undocumented behaviour: Apple may change it.

export type HapticKind = 'tap' | 'medium' | 'heavy';

const VIBRATE_MS: Record<HapticKind, number | number[]> = {
  tap: 8,
  medium: 18,
  heavy: [30, 40, 30],
};

let switchLabel: HTMLLabelElement | null = null;

function iosSwitchLabel(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (switchLabel?.isConnected) return switchLabel;
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.appendChild(input);
  document.body.appendChild(label);
  switchLabel = label;
  return label;
}

export function haptic(kind: HapticKind): void {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && typeof nav.vibrate === 'function') {
      nav.vibrate(VIBRATE_MS[kind]);
      return;
    }
    iosSwitchLabel()?.click();
  } catch {
    // no haptics here
  }
}
