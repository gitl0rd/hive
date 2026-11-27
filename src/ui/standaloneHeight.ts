// Pure: used by viewportFix.web.ts. Kept apart so the web file never imports itself.

/**
 * iOS home-screen web apps with a translucent status bar size the page as if the status bar were
 * still there: the page ends one status-bar height short of the screen bottom, leaving a bare
 * band. Given the window and screen sizes, the height the page should be, or null to leave it.
 */
export function standaloneHeight(v: {
  standalone: boolean;
  innerWidth: number;
  innerHeight: number;
  screenWidth: number;
  screenHeight: number;
}): number | null {
  if (!v.standalone) return null;
  const portrait = v.innerHeight >= v.innerWidth;
  // screen.width/height don't swap on rotation in iOS Safari: pick the long side for portrait.
  const long = Math.max(v.screenWidth, v.screenHeight);
  const short = Math.min(v.screenWidth, v.screenHeight);
  const full = portrait ? long : short;
  const gap = full - v.innerHeight;
  // Only the status-bar-sized shortfall (about 20–70px); anything else isn't this bug.
  return gap > 0 && gap <= 80 ? full : null;
}
