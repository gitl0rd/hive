// BEACH: same K layout; warm sand screen on a deep night-sea, a pixel seagull instead of the bee,
// seafoam wings and trail, and pixel wave crests rolling across a faint dot-matrix behind everything.

import { GULL } from './sprites';
import type { Theme } from './types';

/** Seafoam. Hive-only tasks use it so they stay distinct from the sand screen. */
const SEAFOAM = '#5FE6CF';

export const beach: Theme = {
  id: 'beach',
  name: 'BEACH',
  blurb: 'SAND SCREEN · PIXEL GULL',
  palette: {
    bg: '#02121A',
    screen: '#FFD48A',
    hive: SEAFOAM,
    trail: SEAFOAM,
    wing: SEAFOAM,
  },
  words: {
    brand: 'BEACH·HIVE',
    comb: 'SHORE.SYS',
    log: 'TIDE.LOG',
    phase: { ready: '● LOW TIDE', flying: '◌ GLIDING', landed: '■ LANDED' },
    spin: '▶ SOAR',
    spinning: '◌ GLIDING …',
    nothingToSpin: 'NOTHING ON SHORE',
    spinTab: 'SOAR',
    emptyBoard: 'NO SHELLS. ADD ONE OR SYNC.',
    emptyHistory: 'NO ENTRIES. SOAR TO BEGIN.',
    item: 'shell',
    items: 'shells',
    lockedPlaceholder: 'gull in flight…',
    a11y: {
      comb: 'Shore',
      log: 'Tide log',
      spin: 'Soar',
      inFlight: 'Gull in flight',
      nothingToSpin: 'Nothing on the shore',
      landedOn: (title, project) => `The gull landed on ${title}, ${project}.`,
      resetHint: 'Clears the landing and sends the gull home. Nothing is removed.',
    },
  },
  sprite: GULL,
  backdrop: 'waves',
  logRewrites: [
    [/^HIVE\.EXE v2\.0$/, 'BEACH.HIVE v2.0'],
    [/^(\d\d:\d\d > )dispatch bee$/, '$1launch gull'],
    [/^(\s+)hop (\d+ {2})/, '$1glide $2'],
    [/^(\d\d:\d\d > \d+ )flower(s?) overdue$/, '$1shell$2 overdue'],
    [/^(\d\d:\d\d > )no flowers to spin$/, '$1no shells on shore'],
    [/^(\d\d:\d\d > )shuffle comb /, '$1rake sand '],
    [/^(\d\d:\d\d > )recall bee \.\.\. flight aborted$/, '$1recall gull ... flight aborted'],
    [/^(\d\d:\d\d > )reset comb \.\.\. bee home$/, '$1reset shore ... gull home'],
  ],
  icon: {
    native: 'Beach',
    favicon: 'icons/favicon-beach.png',
    appleTouch: 'icons/apple-touch-icon-beach.png',
  },
};
