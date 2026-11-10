// Local-date helpers. "Today" is always the device's local calendar day.

/** 'YYYY-MM-DD' for the local calendar day of `d`. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole calendar days from `dueDate` ('YYYY-MM-DD' or a full datetime) to `today`. 0 if not late. */
export function daysLate(dueDate: string, today: Date): number {
  const [y, m, d] = dueDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  const due = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((now - due) / 86_400_000));
}

/** 'HH:MM' local, for log lines. */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
