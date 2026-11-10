// Temporary board state for M3 (static board on sample data). M5 replaces this with store/useHive.
import { useMemo, useState } from 'react';

import { boardCounts, eligibleIds } from '../domain/board';
import type { Flower, Landing } from '../domain/types';
import {
  sampleDone,
  sampleFlowers,
  sampleHistory,
  sampleLog,
  sampleSeed,
} from '../demo/sampleData';

export interface BoardModel {
  flowers: Flower[];
  excluded: ReadonlySet<string>;
  included: ReadonlySet<string>;
  counts: { flowers: number; late: number };
  log: string[];
  history: Landing[];
  done: number;
  seed: number;
  toggle: (id: string) => void;
}

export function useSampleBoard(): BoardModel {
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const flowers = sampleFlowers;
  return useMemo(
    () => ({
      flowers,
      excluded,
      included: eligibleIds(flowers, excluded),
      counts: boardCounts(flowers, excluded),
      log: sampleLog,
      history: sampleHistory,
      done: sampleDone,
      seed: sampleSeed,
      toggle: (id: string) =>
        setExcluded((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
    }),
    [flowers, excluded],
  );
}
