// Text helpers for cells, lists and the log. Pure.

/**
 * 3-letter project code for list rows: 'Mega Dog' -> 'MDG', 'Inbox' -> 'INB', 'Hive' -> 'HIV',
 * 'Work' -> 'WRK', 'Side Project Ideas' -> 'SPI'.
 */
export function projectCode(name: string): string {
  const words = name
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return '---';
  if (words.length >= 3)
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('');

  const consonantsAfterFirst = (w: string) => w.slice(1).replace(/[AEIOU]/g, '');
  let code: string;
  if (words.length === 2) {
    const [a, b] = words;
    code = a[0] + b[0] + (consonantsAfterFirst(b) || b.slice(1) || a.slice(1));
  } else {
    const w = words[0];
    code = w[0] + consonantsAfterFirst(w);
    // Pad with the remaining letters in order (HIVE -> HV -> HIV)
    for (const ch of w.slice(1)) {
      if (code.length >= 3) break;
      if (/[AEIOU]/.test(ch)) code = insertInOrder(w, code, ch);
    }
  }
  return code.slice(0, 3).padEnd(3, '-');
}

/** Insert `ch` into `code` so letters keep their order of appearance in `word`. */
function insertInOrder(word: string, code: string, ch: string): string {
  const used = new Set<number>();
  const pos = (c: string) => {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === c && !used.has(i)) {
        used.add(i);
        return i;
      }
    }
    return word.length;
  };
  const letters = [...code].map((c) => ({ c, i: pos(c) }));
  letters.push({ c: ch, i: pos(ch) });
  return letters
    .sort((a, b) => a.i - b.i)
    .map((l) => l.c)
    .join('');
}

/** '!2D' late tag, or '' when not late. */
export function lateTag(daysLate: number | undefined): string {
  return daysLate && daysLate > 0 ? `!${daysLate}D` : '';
}

/** Two-digit zero-padded count for the stats ('07'). */
export function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

/**
 * Word-wrap `text` into at most `maxLines` lines of at most `maxChars` characters (monospace font).
 * Long words are hard-broken. If it doesn't fit, the last line ends with '…'.
 */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || maxChars < 1 || maxLines < 1) return [];
  const lines: string[] = [];
  let cur = '';
  const push = () => {
    lines.push(cur);
    cur = '';
  };
  for (let w of words) {
    while (w.length > maxChars) {
      if (cur) push();
      lines.push(w.slice(0, maxChars));
      w = w.slice(maxChars);
    }
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += ' ' + w;
    else {
      push();
      cur = w;
    }
  }
  if (cur) push();
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] = (last.length >= maxChars ? last.slice(0, maxChars - 1) : last) + '…';
  return kept;
}
