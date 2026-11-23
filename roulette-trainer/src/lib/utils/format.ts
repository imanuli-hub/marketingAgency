/**
 * Number/money formatting. The active locale and currency are configured once
 * by the app shell (`configureFormat`) so every formatter stays a plain function.
 * In Hebrew, values are wrapped in Unicode isolates so "−€2.50" keeps its
 * left-to-right order inside right-to-left text.
 */
export type Locale = "he" | "en";
export type Currency = "EUR" | "USD" | "ILS";

const SYMBOL: Record<Currency, string> = { EUR: "€", USD: "$", ILS: "₪" };
let current: { locale: Locale; currency: Currency } = { locale: "en", currency: "EUR" };

export function configureFormat(locale: Locale, currency: Currency) {
  current = { locale, currency };
}
export const currencySymbol = () => SYMBOL[current.currency];

const LRI = "⁦";
const PDI = "⁩";
const iso = (s: string) => (current.locale === "he" ? `${LRI}${s}${PDI}` : s);

export const fmtMoney = (x: number, opts: { sign?: boolean; decimals?: number } = {}) => {
  const d = opts.decimals ?? (Number.isInteger(Math.round(x * 100) / 100) ? 0 : 2);
  const abs = Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const sign = x < 0 && Math.abs(x) >= 0.005 ? "−" : opts.sign && x > 0 ? "+" : "";
  return iso(`${sign}${sign ? "\u2060" : ""}${SYMBOL[current.currency]}${abs}`);
};
export const fmtPct = (x: number, digits = 1) => iso(`${(x * 100).toFixed(digits)}%`);
export const fmtNum = (x: number, digits = 0) => iso(x.toLocaleString("en-US", { maximumFractionDigits: digits }));
export const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return iso(h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`);
};
export const fmtDate = (t: number) => new Date(t).toLocaleDateString(current.locale === "he" ? "he-IL" : "en-GB");
export const fmtDateTime = (t: number) => new Date(t).toLocaleString(current.locale === "he" ? "he-IL" : "en-GB", { dateStyle: "short", timeStyle: "short" });
export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
