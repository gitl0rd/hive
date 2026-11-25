// Web: work around the iOS home-screen-app height bug (see standaloneHeight.ts).
import { standaloneHeight } from './standaloneHeight';

/** Stretch <html> to the full screen in an iOS home-screen app. Returns a cleanup function. */
export function fixStandaloneHeight(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  const apply = () => {
    try {
      const h = standaloneHeight({
        standalone: (navigator as Navigator & { standalone?: boolean }).standalone === true,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      });
      document.documentElement.style.height = h ? `${h}px` : '';
    } catch {
      // cosmetic only
    }
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  return () => {
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
  };
}
