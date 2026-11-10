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

/**
 * Grid cells the path passes through, for a tile `w`×`h` cut into `cell`-sized squares.
 * Cells wrap around the tile edges so neighbouring tiles join up.
 */
export function pixelatePath(d: string, w: number, h: number, cell: number): [number, number][] {
  const cols = Math.round(w / cell);
  const rows = Math.round(h / cell);
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const p of samplePath(d)) {
    const c = ((Math.floor(p.x / cell) % cols) + cols) % cols;
    const r = ((Math.floor(p.y / cell) % rows) + rows) % rows;
    const key = `${c},${r}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push([c, r]);
    }
  }
  return out;
}
