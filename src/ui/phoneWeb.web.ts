// Web: true on a phone/tablet touchscreen (Safari or Chrome tab, or a home-screen app). There the
// device's own rounded screen edge is the bezel, so the drawn CRT bezel is just a second,
// mismatched border. Desktop browsers (fine pointer) keep it.
export function isPhoneWeb(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    return window.matchMedia?.('(pointer: coarse)').matches === true;
  } catch {
    return false;
  }
}
