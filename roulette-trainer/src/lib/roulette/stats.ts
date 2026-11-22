export function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

/** Linear-interpolated quantile, q in [0, 1]. */
export function quantile(xs: readonly number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export const median = (xs: readonly number[]) => quantile(xs, 0.5);

export function stdDev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

export interface Bin {
  from: number;
  to: number;
  count: number;
}

export function histogram(xs: readonly number[], bins = 30): Bin[] {
  if (!xs.length) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const x of xs) { if (x < min) min = x; if (x > max) max = x; }
  if (min === max) return [{ from: min, to: max, count: xs.length }];
  const width = (max - min) / bins;
  const out: Bin[] = Array.from({ length: bins }, (_, i) => ({ from: min + i * width, to: min + (i + 1) * width, count: 0 }));
  for (const x of xs) out[Math.min(bins - 1, Math.floor((x - min) / width))].count++;
  return out;
}

/** Largest peak-to-trough decline in a series of bankroll values. */
export function maxDrawdown(series: readonly number[]): number {
  let peak = -Infinity;
  let dd = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    dd = Math.max(dd, peak - v);
  }
  return dd;
}
