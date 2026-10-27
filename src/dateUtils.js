const pad = (n) => String(n).padStart(2, '0');

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

// Monday = 0 ... Sunday = 6
export const mondayIndex = (d) => (d.getDay() + 6) % 7;

export const startOfWeek = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -mondayIndex(d));

export const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

export const sameDay = (a, b) => toKey(a) === toKey(b);

// Rows of Date|null for a month grid (Mon-first). cols = 7 or 5 (weekends hidden).
export function monthWeeks(anchor, cols) {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const weeks = [];
  let cursor = startOfWeek(first);
  while (cursor <= last) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const day = addDays(cursor, c);
      row.push(day.getMonth() === first.getMonth() ? day : null);
    }
    if (row.some(Boolean)) weeks.push(row);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function weekRow(anchor, cols) {
  const start = startOfWeek(anchor);
  return [Array.from({ length: cols }, (_, c) => addDays(start, c))];
}

export function formatRange(a, b) {
  const sameYear = a.getFullYear() === b.getFullYear();
  const left = `${MONTHS_SHORT[a.getMonth()]} ${a.getDate()}${sameYear ? '' : `, ${a.getFullYear()}`}`;
  const right = `${MONTHS_SHORT[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
  return `${left} – ${right}`;
}
