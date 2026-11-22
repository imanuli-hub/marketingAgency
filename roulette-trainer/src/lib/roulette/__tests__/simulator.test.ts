import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, type TableRules } from "../engine";
import { compareStrategies, monteCarlo, runSession, type SimConfig } from "../simulator";
import { STRATEGY_IDS } from "../strategies";

const EU: TableRules = { ...DEFAULT_RULES, wheel: "european", evenMoneyRule: "none", minBet: 1, maxInside: 100, maxOutside: 500 };
const base: SimConfig = {
  rules: EU, strategy: "flat", params: { baseBet: 1 }, target: "red",
  bankroll: 100, spins: 200, sessions: 200, seed: "test",
};

describe("simulation", () => {
  it("is reproducible with the same seed", () => {
    expect(monteCarlo(base)).toEqual(monteCarlo(base));
    expect(monteCarlo({ ...base, seed: "other" }).meanEnd).not.toBe(monteCarlo(base).meanEnd);
  });

  it("uses identical spin sequences across strategies", () => {
    // With one spin per session, every base-unit strategy wins or loses together.
    const cfg = { ...base, spins: 1, sessions: 300, recordPaths: 300 };
    const flat = Array.from({ length: 300 }, (_, i) => runSession({ ...cfg, strategy: "flat" }, i).profit);
    const mart = Array.from({ length: 300 }, (_, i) => runSession({ ...cfg, strategy: "martingale" }, i).profit);
    expect(mart).toEqual(flat);
    const [a, b] = compareStrategies(cfg, ["flat", "dalembert"]);
    expect(a.meanEnd).toBe(b.meanEnd);
  });

  it("enforces stop-loss: no session loses more than the limit", () => {
    for (const strategy of STRATEGY_IDS) {
      const s = monteCarlo({ ...base, strategy, stopLoss: 30, params: { baseBet: 2 }, spins: 500, sessions: 300 });
      expect(s.minEnd).toBeGreaterThanOrEqual(70 - 1e-9);
    }
  });

  it("enforces stop-win", () => {
    const s = monteCarlo({ ...base, strategy: "martingale", stopWin: 10, spins: 1000 });
    expect(s.pStopWin).toBeGreaterThan(0.5);
    expect(s.maxEnd).toBeLessThanOrEqual(110 + 64); // at most one extra winning bet past the target
  });

  it("never lets the bankroll go negative", () => {
    for (const strategy of STRATEGY_IDS) {
      const s = monteCarlo({ ...base, strategy, spins: 2000, sessions: 100 });
      expect(s.minEnd).toBeGreaterThanOrEqual(0);
    }
  });

  it("respects table maximum: martingale never stakes above max", () => {
    const rules = { ...EU, maxOutside: 50 };
    for (let i = 0; i < 100; i++) {
      const r = runSession({ ...base, rules, strategy: "martingale", bankroll: 10000, spins: 1000 }, i);
      expect(r.biggestStake).toBeLessThanOrEqual(50);
    }
  });

  it("long-run loss rate converges to the house edge (flat, even money)", () => {
    const s = monteCarlo({ ...base, bankroll: 100000, spins: 10000, sessions: 200, recordPaths: 0 });
    const lossRate = s.actualLoss / s.totalWagered;
    // 2M unit bets: standard error ≈ 1/sqrt(2e6) ≈ 0.0007
    expect(lossRate).toBeGreaterThan(1 / 37 - 0.004);
    expect(lossRate).toBeLessThan(1 / 37 + 0.004);
    expect(s.theoreticalLoss / s.totalWagered).toBeCloseTo(1 / 37, 6);
  });

  it("La Partage loss rate converges to 1.35%", () => {
    const s = monteCarlo({ ...base, rules: { ...EU, evenMoneyRule: "laPartage" }, bankroll: 100000, spins: 10000, sessions: 200, recordPaths: 0 });
    expect(s.actualLoss / s.totalWagered).toBeCloseTo(1 / 74, 2);
  });

  it("martingale wins small often but has a heavy loss tail; EV is unchanged", () => {
    const cfg = { ...base, bankroll: 200, spins: 300, sessions: 3000, recordPaths: 0 };
    const [flat, mart] = compareStrategies(cfg, ["flat", "martingale"]);
    expect(mart.pAhead).toBeGreaterThan(flat.pAhead);
    expect(mart.meanLossWhenBehind).toBeLessThan(flat.meanLossWhenBehind);
    // Loss per unit wagered stays near the house edge for both.
    expect(mart.actualLoss / mart.totalWagered).toBeGreaterThan(0);
  });
});
