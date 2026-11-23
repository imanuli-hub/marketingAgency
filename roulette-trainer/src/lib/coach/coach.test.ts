import { describe, expect, it } from "vitest";
import * as B from "@/lib/roulette/bets";
import { DEFAULT_RULES } from "@/lib/roulette/engine";
import { analyze, normalCdf } from "./coach";
import type { CoachInput, SpinRecord } from "./types";

const base: CoachInput = { mode: "intermediate", rules: DEFAULT_RULES, bets: [], balance: 1000, session: null, now: 0 };
const spin = (pocket: number, staked: number, net: number): SpinRecord => ({ pocket, staked, returned: staked + net, net, balanceAfter: 0, at: 0, bets: [] });

describe("coach", () => {
  it("normal CDF", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
  });
  it("reports probability and exposure", () => {
    const ins = analyze({ ...base, bets: [B.place(B.red(), 300)] });
    expect(ins.find((i) => i.id === "exposure")?.tone).toBe("danger");
    expect(ins.find((i) => i.id === "bet")?.body).toMatch(/48\.6%/);
  });
  it("warns near the stop loss and when it is hit", () => {
    const session = { startBalance: 1000, startedAt: 0, spins: [], stopLoss: 100 };
    expect(analyze({ ...base, balance: 920, session }).some((i) => i.id === "stoploss-near")).toBe(true);
    expect(analyze({ ...base, balance: 900, session }).some((i) => i.id === "stoploss-hit")).toBe(true);
  });
  it("detects chasing losses", () => {
    const session = { startBalance: 1000, startedAt: 0, spins: [spin(1, 10, 10), spin(2, 10, -10)] };
    expect(analyze({ ...base, bets: [B.place(B.red(), 40)], session }).some((i) => i.id === "chasing")).toBe(true);
  });
  it("explains independence after a colour streak", () => {
    const session = { startBalance: 1000, startedAt: 0, spins: [1, 3, 5, 7].map((p) => spin(p, 1, -1)) };
    const ins = analyze({ ...base, bets: [B.place(B.black(), 1)], session });
    expect(ins.find((i) => i.id === "fallacy")?.title).toMatch(/not "due"/);
  });
  it("checks strategy adherence", () => {
    const session = { startBalance: 1000, startedAt: 0, spins: [spin(2, 5, -5)] };
    const ok = analyze({ ...base, bets: [B.place(B.red(), 10)], session, strategy: { id: "martingale", baseBet: 5 } });
    expect(ok.find((i) => i.id === "strategy")?.tone).toBe("good");
    const off = analyze({ ...base, bets: [B.place(B.red(), 5)], session, strategy: { id: "martingale", baseBet: 5 } });
    expect(off.find((i) => i.id === "strategy")?.tone).toBe("warn");
  });
  it("never mentions predicting numbers", () => {
    const text = JSON.stringify(analyze({ ...base, mode: "advanced", bets: [B.place(B.straight(7), 5)] }));
    expect(text).not.toMatch(/hot number|due to hit|predict/i);
  });
});

describe("coach (localized and new insights)", () => {
  it("speaks Hebrew with the same numbers", () => {
    const he = analyze({ ...base, locale: "he", bets: [B.place(B.red(), 300)] });
    const en = analyze({ ...base, locale: "en", bets: [B.place(B.red(), 300)] });
    expect(he.map((i) => i.id)).toEqual(en.map((i) => i.id));
    expect(he.find((i) => i.id === "exposure")?.title).toMatch(/מהקופה/);
    expect(he.find((i) => i.id === "bet")?.body).toMatch(/48\.6%/);
  });
  it("explains each selected bet with its net payout", () => {
    const ins = analyze({ ...base, bets: [B.place(B.straight(17), 2), B.place(B.red(), 2)] });
    const body = ins.find((i) => i.id === "bets")!.body;
    expect(body).toMatch(/Straight 17: pays 35:1, wins 2\.7% of spins, net \+€70/);
    expect(body).toMatch(/Red: pays 1:1/);
  });
  it("explains losing streaks as normal", () => {
    const session = { startBalance: 100, startedAt: 0, spins: [2, 4, 6, 8].map((p) => spin(p, 2, -2)) };
    expect(analyze({ ...base, session }).find((i) => i.id === "streak")?.title).toMatch(/4 losing spins/);
  });
  it("explains that stop rules do not change the edge", () => {
    const session = { startBalance: 100, startedAt: 0, spins: [], stopLoss: 20, stopWin: 10 };
    const s = analyze({ ...base, session, strategy: { id: "flat", baseBet: 2 } }).find((i) => i.id === "stop-rules");
    expect(s?.body).toMatch(/does not change the 2\.70% edge/);
    expect(s?.body).toMatch(/about 5[78]%/);
  });
  it("detects a progression broken by the table maximum", () => {
    const spins = Array.from({ length: 8 }, (_, i) => ({ ...spin(2, 2 ** i, -(2 ** i)), balanceAfter: 1000 }));
    const ins = analyze({ ...base, rules: { ...DEFAULT_RULES, maxOutside: 200 }, bets: [B.place(B.red(), 2)], session: { startBalance: 1000, startedAt: 0, spins }, strategy: { id: "martingale", baseBet: 1 } });
    expect(ins.find((i) => i.id === "strategy")?.title).toMatch(/table limit/);
  });
});
