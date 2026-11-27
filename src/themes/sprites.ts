// Pixel sprites, one character per pixel:
//   B body (screen colour)   W wing (wing colour, translucent)   s background colour   . empty
// A sprite can add its own fixed-colour pixels in `paint` (the gull's white body, yellow beak).

export interface Sprite {
  id: 'bee' | 'brain' | 'gull' | 'head' | 'flower' | 'palm';
  w: number;
  h: number;
  rows: readonly string[];
  /** Opacity of W pixels */
  wingOpacity: number;
  /** Extra pixel kinds with fixed colours, e.g. { Y: '#FFC43C' } for a yellow beak */
  paint?: Readonly<Record<string, string>>;
}

/** The theme-coloured pixel kinds every sprite can use. */
export interface SpriteInks {
  B: string;
  W: string;
  s: string;
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

/**
 * 18×9 herring gull gliding right: white head and body, pale grey wing raised and bent at the
 * wrist with dark tips, dark eye, yellow beak, white tail.
 */
export const GULL: Sprite = {
  id: 'gull',
  w: 18,
  h: 9,
  wingOpacity: 1,
  paint: { H: '#F6F4EC', G: '#BECDD4', K: '#5A6B74', Y: '#FFC43C' },
  rows: [
    '.........GG.......',
    '.......GGGG.......',
    '.....GGGGGG.......',
    '...KGGGG.GGG..HH..',
    '.KKKGG....GG.HHsH.',
    'KKK.......GGHHHHYY',
    '.........GGHHHHH..',
    'HHHHHHHHHHHHHHH...',
    '.HHHHHHHHHHHH.....',
  ],
};

/** Runs of same-kind pixels per row, so a sprite draws as a few rects instead of one per pixel. */
export function spriteRuns(s: Sprite): { x: number; y: number; w: number; kind: string }[] {
  const out: { x: number; y: number; w: number; kind: string }[] = [];
  s.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.') out.push({ x, y, w: end - x, kind: ch });
      x = end;
    }
  });
  return out;
}

/** Fill colour for a pixel kind: the theme's ink for B / W / s, else the sprite's own paint. */
export function pixelFill(s: Sprite, kind: string, ink: SpriteInks): string {
  if (kind === 'B' || kind === 'W' || kind === 's') return ink[kind];
  return s.paint?.[kind] ?? ink.B;
}

/** 11×13 profile head facing right, for the heads side of the coin (only B and s pixels). */
export const COIN_HEAD: Sprite = {
  id: 'head',
  w: 11,
  h: 13,
  wingOpacity: 1,
  rows: [
    '...BBBBB...',
    '.BBBBBBBBB.',
    '.BBBBBBBBB.',
    'BBBBBBBBBB.',
    'BBBBBBBsBBB',
    'BBBBBBBBBBB',
    'BBBBBBBBBBB',
    '.BBBBBBBBB.',
    '.BBBBBBsss.',
    '..BBBBBBB..',
    '...BBBBB...',
    '...BBBBB...',
    '.BBBBBBBBB.',
  ],
};

/** 11×15 flower for the heads side of the coin in BEE·HIVE: eight petals, dotted centre, stem. */
export const COIN_FLOWER: Sprite = {
  id: 'flower',
  w: 11,
  h: 15,
  wingOpacity: 0.55,
  rows: [
    '....BBB....',
    '...BBBBB...',
    '.BB.BBB.BB.',
    'BBBB.B.BBBB',
    'BBB.sss.BBB',
    '.B.BsBsB.B.',
    'BBB.sss.BBB',
    'BBBB.B.BBBB',
    '.BB.BBB.BB.',
    '...BBBBB...',
    '....BBB....',
    '.....W.....',
    '.WWW.W.WWW.',
    '...WWWWW...',
    '.....W.....',
  ],
};

/** 14×14 palm tree for the heads side of the coin in BEACH: fronds, coconuts, curved trunk, sand. */
export const COIN_PALM: Sprite = {
  id: 'palm',
  w: 14,
  h: 14,
  wingOpacity: 1,
  paint: { F: '#4FC86E', f: '#2E8C50', T: '#C48C50', C: '#7A4E28' },
  rows: [
    '...ff.....FF..',
    '.fFFFF..FFFFF.',
    'fF...FFFFF..FF',
    'F...FFFCFFF...',
    '...FF.CTCF.F..',
    '..F...FT..F...',
    '......T.......',
    '......TT......',
    '.......T......',
    '.......T......',
    '.......TT.....',
    '........T.....',
    '.....BBBBBB...',
    '..BBBBBBBBBBB.',
  ],
};
