// Show a stored (hive-worded) log line in a theme's words. Pure.

import type { Theme } from './types';

export function themeLogLine(line: string, theme: Pick<Theme, 'logRewrites'>): string {
  let out = line;
  for (const [re, to] of theme.logRewrites) out = out.replace(re, to);
  return out;
}
