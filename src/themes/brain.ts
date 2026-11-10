// BRAIN HIVE: the experiment from the design canvas (page "v2 · daily spin", row
// "Experiment · BRAIN HIVE"). Same K layout; pink screen on near-black plum, a winged brain
// instead of the bee, synapse-cyan wings and trail, faint brain folds behind everything.

import { BRAIN } from './sprites';
import type { Theme } from './types';

/** Synapse cyan. Hive-only tasks use it so they stay distinct from pink projects (magenta). */
const SYNAPSE = '#7FE3FF';

export const brain: Theme = {
  id: 'brain',
  name: 'BRAIN HIVE',
  blurb: 'PINK CORTEX · WINGED BRAIN',
  palette: {
    bg: '#0E0509',
    screen: '#FF8FB8',
    hive: SYNAPSE,
    trail: SYNAPSE,
    wing: SYNAPSE,
  },
  words: {
    brand: 'BRAIN·HIVE',
    comb: 'CORTEX.SYS',
    log: 'SYNAPSE.LOG',
    phase: { ready: '● AWAKE', flying: '◌ FIRING', landed: '■ FOCUSED' },
    spin: '▶ THINK',
    spinning: '◌ FIRING …',
    nothingToSpin: 'NOTHING TO THINK',
    spinTab: 'THINK',
    emptyBoard: 'NO THOUGHTS. ADD ONE OR SYNC.',
    emptyHistory: 'NO ENTRIES. THINK TO BEGIN.',
    item: 'thought',
    items: 'thoughts',
    lockedPlaceholder: 'synapse firing…',
    a11y: {
      comb: 'Cortex',
      log: 'Synapse log',
      spin: 'Think',
      inFlight: 'Synapse firing',
      nothingToSpin: 'Nothing to think about',
      landedOn: (title, project) => `Focused on ${title}, ${project}.`,
      resetHint: 'Clears the focus and settles the brain. Nothing is removed.',
    },
  },
  sprite: BRAIN,
  backdrop: 'gyri',
  logRewrites: [
    [/^HIVE\.EXE v2\.0$/, 'BRAIN.HIVE v2.0'],
    [/^(\d\d:\d\d > )dispatch bee$/, '$1fire synapse'],
    [/^(\s+)hop (\d+ {2})/, '$1spark $2'],
    [/^(\d\d:\d\d > )LANDED: /, '$1FOCUS: '],
    [/^(\d\d:\d\d > \d+ )flower(s?) overdue$/, '$1thought$2 overdue'],
    [/^(\d\d:\d\d > )no flowers to spin$/, '$1no thoughts to fire'],
    [/^(\d\d:\d\d > )shuffle comb /, '$1shuffle cortex '],
    [/^(\d\d:\d\d > )recall bee \.\.\. flight aborted$/, '$1recall synapse ... firing aborted'],
    [/^(\d\d:\d\d > )reset comb \.\.\. bee home$/, '$1reset cortex ... brain at rest'],
  ],
  icon: {
    native: 'Brain',
    favicon: 'icons/favicon-brain.png',
    appleTouch: 'icons/apple-touch-icon-brain.png',
  },
};
