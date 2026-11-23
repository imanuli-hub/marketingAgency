import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "../engine";
import { probReachBefore } from "../probability";
import { compareStrategies, monteCarlo } from "../simulator";
import { wilson } from "../stats";

const profile = {
  rules: { ...DEFAULT_RULES, wheel: "european" as const, evenMoneyRule: "none" as const, minBet: 1, maxInside: 50, maxOutside: 200 },
  params: { baseBet: 2 }, target: "red" as const, bankroll: 100, spins: 5000, sessions: 20000,
  stopWin: 10, stopLoss: 20, seed: "profile", recordPaths: 0,
};

describe("reach €110 before €80 (flat €2 on red)", () => {
  const exact = probReachBefore(18 / 37, 5, 10);
  it("analytic gambler's-ruin value is about 57%", () => {
    expect(exact).toBeGreaterThan(0.56);
    expect(exact).toBeLessThan(0.59);
  });
  it("simulation agrees with the exact value within its confidence interval", () => {
    const s = monteCarlo({ ...profile, strategy: "flat" });
    expect(s.pNeither).toBe(0);
    expect(s.ci.pStopWin[0]).toBeLessThan(exact);
    expect(s.ci.pStopWin[1]).toBeGreaterThan(exact);
    // Expected result = P(win)·10 − P(lose)·20, negative.
    expect(s.ci.meanProfit[0]).toBeLessThan(exact * 10 - (1 - exact) * 20 + 0.5);
    expect(s.meanProfit).toBeLessThan(0);
  });
  it("martingale reaches the target more often, still with a negative average", () => {
    const [flat, mart] = compareStrategies({ ...profile, sessions: 5000 }, ["flat", "martingale"]);
    expect(mart.pStopWin).toBeGreaterThan(flat.pStopWin);
    expect(mart.meanProfit).toBeLessThan(0);
  });
});

describe("wilson interval", () => {
  it("brackets the proportion and narrows with n", () => {
    const [a, b] = wilson(50, 100);
    expect(a).toBeLessThan(0.5);
    expect(b).toBeGreaterThan(0.5);
    const [c, d] = wilson(5000, 10000);
    expect(d - c).toBeLessThan(b - a);
    expect(wilson(0, 10)[0]).toBe(0);
  });
});
