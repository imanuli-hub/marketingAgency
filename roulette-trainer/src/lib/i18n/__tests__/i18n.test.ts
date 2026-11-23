import { describe, expect, it } from "vitest";
import { en } from "../en";
import { he } from "../he";
import { betLabel } from "../bet-labels";
import * as B from "@/lib/roulette/bets";
import { configureFormat, fmtMoney } from "@/lib/utils/format";
import { FINAL_SECTIONS } from "@/lib/training/program-state";

const keys = Object.keys(en) as (keyof typeof en)[];
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("localization", () => {
  it("Hebrew has exactly the English keys, none empty", () => {
    expect(Object.keys(he).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(he[k].trim().length, k).toBeGreaterThan(0);
  });
  it("placeholders match in both languages", () => {
    for (const k of keys) expect(vars(he[k]), k).toEqual(vars(en[k]));
  });
  it("Hebrew strings are written in Hebrew (except brand-neutral tokens)", () => {
    const allowLatin = new Set(["controls.spin"]);
    const latinOnly = keys.filter((k) => !/[֐-׿]/.test(he[k]) && !allowLatin.has(k) && /[A-Za-z]{3,}/.test(he[k].replace(/\{\w+\}/g, "")));
    expect(latinOnly).toEqual([]);
  });
  it("every dynamically-built key exists", () => {
    const dynamic = [
      ...["stakePositive", "belowMin", "aboveMax", "noDoubleZero", "notAvailable", "overBalance"].map((c) => `val.${c}`),
      ...["chasing", "oversized", "lossLimitExceeded", "playedPastTarget", "playedPastLimit", "overtime", "strategyDeviation", "highExposure", "fewSpins"].map((w) => `review.warn.${w}`),
      ...["chasing", "stopRules", "strategy", "time", "exposure", "guided", "continue"].map((c) => `review.rec.${c}`),
      ...["stopLoss", "stopWin", "timeLimit", "bankrupt", "manual", "break", "reset"].map((r) => `end.${r}`),
      ...["ready", "nearly", "progress", "start"].map((l) => `level.${l}`),
      ...["fundamentals", "flatSessions", "strategyLab", "rehearsals", "final"].map((m) => `milestone.${m}`),
      ...["practice", "casino", "guided"].map((m) => `mode.${m}`),
      ...FINAL_SECTIONS.flatMap((s) => [`final.${s}`, `final.${s}.desc`]),
      ...["low", "medium", "high", "veryhigh"].map((r) => `risk.${r}`),
      ...["pProfit", "expected", "bigLoss", "depletion", "volume"].flatMap((f) => [`simLab.five.${f}`, `simLab.five.${f}.body`]),
      ...["red", "black", "green"].map((c) => `color.${c}`),
      ...["positive", "baseBetVsBankroll", "stopLossVsBankroll", "sessionRange"].map((c) => `profile.err.${c}`),
    ];
    for (const k of dynamic) expect(en, k).toHaveProperty([k]);
  });
  it("bet labels are localized", () => {
    expect(betLabel(B.split(17, 20), "en")).toBe("Split 17/20");
    expect(betLabel(B.split(17, 20), "he")).toBe("ספליט 17/20");
    expect(betLabel(B.dozen(1), "he")).toMatch(/תריסר ראשון/);
  });
  it("money keeps left-to-right order inside Hebrew text", () => {
    configureFormat("he", "EUR");
    expect(fmtMoney(-2.5)).toBe("\u2066−\u2060€2.50\u2069");
    configureFormat("en", "EUR");
    expect(fmtMoney(10, { sign: true })).toBe("+\u2060€10");
    expect(fmtMoney(10)).toBe("€10");
  });
});
