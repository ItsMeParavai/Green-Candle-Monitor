import { parseKey, isWeekend } from './dateUtils';

export const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = Math.round(n * 100) / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
};

export const fmtPlain = (n) => (Math.round(n * 100) / 100).toFixed(2);

// Sum entries between two keys (inclusive). Pass null for open-ended.
export function sumRange(entries, startKey, endKey, weekends) {
  let total = 0;
  let count = 0;
  Object.keys(entries).forEach((k) => {
    if (startKey && k < startKey) return;
    if (endKey && k > endKey) return;
    if (!weekends && isWeekend(parseKey(k))) return;
    total += entries[k].pnl;
    count += 1;
  });
  return { total, count };
}

export function stats(entries, weekends) {
  const keys = Object.keys(entries).filter((k) => weekends || !isWeekend(parseKey(k)));
  if (!keys.length) return { total: 0, days: 0, wins: 0, losses: 0, best: null, worst: null };
  let total = 0;
  let wins = 0;
  let losses = 0;
  let best = null;
  let worst = null;
  keys.forEach((k) => {
    const v = entries[k].pnl;
    total += v;
    if (v > 0) wins += 1;
    if (v < 0) losses += 1;
    if (!best || v > best.v) best = { k, v };
    if (!worst || v < worst.v) worst = { k, v };
  });
  return { total, days: keys.length, wins, losses, best, worst };
}

// Monthly totals keyed "YYYY-MM"
export function monthTotals(entries, weekends) {
  const out = {};
  Object.keys(entries).forEach((k) => {
    if (!weekends && isWeekend(parseKey(k))) return;
    const mk = k.slice(0, 7);
    out[mk] = (out[mk] || 0) + entries[k].pnl;
  });
  return out;
}
