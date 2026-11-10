// Turn a smooth SVG path into blocky pixels: sample it finely, snap each point to a grid cell.
// Pure. Supports absolute M, L, C and S commands (all the backdrop paths use).

type Pt = { x: number; y: number };

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/** Points along the path, about `step` units apart. */
export function samplePath(d: string, step = 0.5): Pt[] {
  const tokens = d.match(/[MLCS]|-?\d*\.?\d+/g) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cmd = '';
  let cur: Pt = { x: 0, y: 0 };
  let lastCtrl = null as Pt | null;
  const num = () => parseFloat(tokens[i++]);
  const pt = () => ({ x: num(), y: num() });
  const curve = (c1: Pt, c2: Pt, end: Pt) => {
    const approx =
      Math.hypot(c1.x - cur.x, c1.y - cur.y) +
      Math.hypot(c2.x - c1.x, c2.y - c1.y) +
      Math.hypot(end.x - c2.x, end.y - c2.y);
    const n = Math.max(2, Math.ceil(approx / step));
    for (let k = 1; k <= n; k++) out.push(cubic(cur, c1, c2, end, k / n));
    lastCtrl = c2;
    cur = end;
  };
  while (i < tokens.length) {
    if (/[MLCS]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'M') {
      cur = pt();
      lastCtrl = null;
      out.push(cur);
      cmd = 'L'; // extra pairs after M are lines
    } else if (cmd === 'L') {
      const end = pt();
      curve(cur, end, end);
      lastCtrl = null;
    } else if (cmd === 'C') {
      const c1 = pt();
      const c2 = pt();
      curve(c1, c2, pt());
    } else if (cmd === 'S') {
      const c1: Pt = lastCtrl ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur;
      const c2 = pt();
      curve(c1, c2, pt());
    } else {
      i++; // unknown token: skip
    }
  }
  return out;
}

export interface PathCell {
  c: number;
  r: number;
  /** Direction of travel through the cell, radians (SVG coords: y down) */
  angle: number;
}

/**
 * Grid cells the path passes through, for a tile `w`×`h` cut into `cw`×`ch` cells (square if
 * `ch` is left out). Cells wrap around the tile edges so neighbouring tiles join up.
 */
export function pathCells(d: string, w: number, h: number, cw: number, ch = cw): PathCell[] {
  const cols = Math.round(w / cw);
  const rows = Math.round(h / ch);
  const seen = new Set<string>();
  const out: PathCell[] = [];
  const pts = samplePath(d);
  pts.forEach((p, i) => {
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const prev = pts[Math.max(0, i - 1)];
    const c = ((Math.floor(p.x / cw) % cols) + cols) % cols;
    const r = ((Math.floor(p.y / ch) % rows) + rows) % rows;
    const key = `${c},${r}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ c, r, angle: Math.atan2(q.y - prev.y, q.x - prev.x) });
    }
  });
  return out;
}

/** Grid cells the path passes through (square cells). */
export function pixelatePath(d: string, w: number, h: number, cell: number): [number, number][] {
  return pathCells(d, w, h, cell).map((p) => [p.c, p.r]);
}

/** An ASCII stroke for a direction: - | / \ (y down). */
export function asciiFor(angle: number): string {
  let a = ((angle % Math.PI) + Math.PI) % Math.PI; // fold to 0..π
  if (a > Math.PI / 2) a -= Math.PI; // -π/2..π/2
  const deg = (a * 180) / Math.PI;
  if (Math.abs(deg) < 22) return '-';
  if (Math.abs(deg) > 68) return '|';
  return deg > 0 ? '\\' : '/';
}

/** Cells next to (but not on) the given cells, for a glow halo. Wraps like the tile. */
export function haloCells(
  cells: [number, number][],
  cols: number,
  rows: number,
): [number, number][] {
  const on = new Set(cells.map(([c, r]) => `${c},${r}`));
  const out = new Map<string, [number, number]>();
  for (const [c, r] of cells) {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const nc = (c + dc + cols) % cols;
        const nr = (r + dr + rows) % rows;
        const k = `${nc},${nr}`;
        if (!on.has(k)) out.set(k, [nc, nr]);
      }
    }
  }
  return [...out.values()];
}
