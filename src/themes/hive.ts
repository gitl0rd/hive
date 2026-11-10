// The default theme: the K terminal design (docs/PLAN.md §7). Amber screen, pixel bee.

import { HIVE_COLOR } from '../domain/types';
import { BEE } from './sprites';
import type { Theme } from './types';

export const hive: Theme = {
  id: 'hive',
  name: 'HIVE',
  blurb: 'AMBER TERMINAL · PIXEL BEE',
  palette: {
    bg: '#0B0600',
    screen: '#FFA526',
    hive: HIVE_COLOR,
    trail: '#FFA526',
    wing: '#FFA526',
  },
  words: {
    brand: 'HIVE·OS',
    comb: 'COMB.SYS',
    log: 'FLIGHT.LOG',
    phase: { ready: '● READY', flying: '◌ IN FLIGHT', landed: '■ LANDED' },
    spin: '▶ SPIN',
    spinning: '◌ IN FLIGHT …',
    nothingToSpin: 'NOTHING TO SPIN',
    spinTab: 'SPIN',
    emptyBoard: 'NO FLOWERS. ADD ONE OR SYNC.',
    emptyHistory: 'NO ENTRIES. SPIN TO BEGIN.',
    item: 'flower',
    items: 'flowers',
    lockedPlaceholder: 'bee in flight…',
    a11y: {
      comb: 'Comb',
      log: 'Flight log',
      spin: 'Spin',
      inFlight: 'Bee in flight',
      nothingToSpin: 'Nothing to spin',
      landedOn: (title, project) => `The bee landed on ${title}, ${project}.`,
      resetHint: 'Clears the landing and sends the bee home. Nothing is removed.',
    },
  },
  sprite: BEE,
  backdrop: 'none',
  logRewrites: [],
  icon: {
    native: null,
    favicon: 'icons/favicon-hive.png',
    appleTouch: 'icons/apple-touch-icon.png',
  },
};
