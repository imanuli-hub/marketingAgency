export const fmtMoney = (x: number, opts: { sign?: boolean; decimals?: number } = {}) => {
  const d = opts.decimals ?? (Number.isInteger(Math.round(x * 100) / 100) ? 0 : 2);
  const abs = Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const sign = x < 0 ? "−" : opts.sign && x > 0 ? "+" : "";
  return `${sign}$${abs}`;
};
export const fmtPct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
export const fmtNum = (x: number, digits = 0) => x.toLocaleString("en-US", { maximumFractionDigits: digits });
export const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};
export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
