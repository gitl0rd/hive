// Web: point the favicon, apple-touch-icon, theme colour and page background at the theme's.
// (An installed PWA keeps the icon it was installed with; browsers read the manifest once.)

import { getTheme, type ThemeId } from '../themes';

function link(rel: string): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  return el;
}

export function applyAppIcon(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  const theme = getTheme(id);
  try {
    // Relative hrefs: works at / (dev) and /hive/ (GitHub Pages)
    const icon = link('icon');
    icon.type = 'image/png';
    icon.href = theme.icon.favicon;
    link('apple-touch-icon').href = theme.icon.appleTouch;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.palette.bg);
    document.documentElement.style.background = theme.palette.bg;
    document.body.style.background = theme.palette.bg;
  } catch {
    // cosmetic only
  }
}
