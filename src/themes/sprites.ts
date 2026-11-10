// Pixel sprites, one character per pixel:
//   B body (screen colour)   W wing (wing colour, translucent)   s background colour   . empty

export interface Sprite {
  id: 'bee' | 'brain';
  w: number;
  h: number;
  rows: readonly string[];
  /** Opacity of W pixels */
  wingOpacity: number;
}

/** 11×7 pixel bee facing right: wings, striped body, head with an eye, stinger. */
export const BEE: Sprite = {
  id: 'bee',
  w: 11,
  h: 7,
  wingOpacity: 0.55,
  rows: [
    '...WW.WW...',
    '...WW.WW...',
    '.BBsBBsBB..',
    '.BBsBBsBBBB',
    'BBBsBBsBBBs',
    '.BBsBBsBBBB',
    '.BBsBBsBB..',
  ],
};

/** 13×9 winged brain: two lobes split by a fissure, folds, stem, synapse-coloured wings. */
export const BRAIN: Sprite = {
  id: 'brain',
  w: 13,
  h: 9,
  wingOpacity: 0.75,
  rows: [
    '.............',
    '.WW.BB.BB.WW.',
    'WWWBBBsBBBWWW',
    'WWBBBBsBBBBWW',
    '..BssBsBssB..',
    '..BBBBsBBBB..',
    '..BBsBsBBsB..',
    '...BBBBBBB...',
    '......B......',
  ],
};

/** Runs of same-kind pixels per row, so a sprite draws as a few rects instead of one per pixel. */
export function spriteRuns(
  s: Sprite,
): { x: number; y: number; w: number; kind: 'B' | 'W' | 's' }[] {
  const out: { x: number; y: number; w: number; kind: 'B' | 'W' | 's' }[] = [];
  s.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch === 'B' || ch === 'W' || ch === 's') out.push({ x, y, w: end - x, kind: ch });
      x = end;
    }
  });
  return out;
}
