// Web: true when Hive runs as a home-screen app on a phone (iOS "Add to Home Screen", or an
// installed Android PWA). There the phone's own rounded screen edge is the bezel, so the drawn
// CRT bezel would just be a second, mismatched border.
export function isInstalledPhoneWebApp(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const standalone =
      iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
    const touchPhone = window.matchMedia?.('(pointer: coarse)').matches === true;
    return standalone && (iosStandalone || touchPhone);
  } catch {
    return false;
  }
}
