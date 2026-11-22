import { describe, expect, it } from "vitest";
import { createStrategy, scriptedProgression, type StrategyId } from "../strategies";

const ctx = { bankroll: 1000, minBet: 1, payout: 1 };
function stakes(id: StrategyId, results: number[], params = { baseBet: 1 }) {
  const s = createStrategy(id, params);
  const out: number[] = [];
  for (const sign of results) {
    const stake = s.nextStake(ctx);
    out.push(stake);
    s.record(sign * stake, ctx);
  }
  out.push(s.nextStake(ctx));
  return out;
}
const L = -1, W = 1;

describe("strategy progressions", () => {
  it("flat", () => expect(stakes("flat", [L, L, W, L])).toEqual([1, 1, 1, 1, 1]));
  it("martingale doubles after losses and resets after a win", () =>
    expect(stakes("martingale", [L, L, L, W, L])).toEqual([1, 2, 4, 8, 1, 2]));
  it("paroli doubles after wins and resets after 3 wins or a loss", () =>
    expect(stakes("paroli", [W, W, W, W, L])).toEqual([1, 2, 4, 1, 2, 1]));
  it("d'alembert +1 after loss, -1 after win (min 1)", () =>
    expect(stakes("dalembert", [L, L, W, W, W])).toEqual([1, 2, 3, 2, 1, 1]));
  it("fibonacci forward one on loss, back two on win", () =>
    expect(stakes("fibonacci", [L, L, L, L, W, W])).toEqual([1, 1, 2, 3, 5, 2, 1]));
  it("labouchere bets ends of the line", () => {
    // line 1,2,3,4: bet 5 (L) -> 1,2,3,4,5 bet 6 (W) -> 2,3,4 bet 6 (W) -> 3 bet 3 (W) -> cleared -> restart 5
    expect(stakes("labouchere", [L, W, W, W])).toEqual([5, 6, 6, 3, 5]);
  });
  it("oscar's grind aims for +1 unit per cycle", () => {
    // L(1) cycle -1; W(1) cycle 0 -> bet 2; W: bet min(2, need 1)=1 -> cycle +1 reset
    expect(stakes("oscar", [L, W, W])).toEqual([1, 1, 1, 1]);
    // L,L (cycle -2), W(1) -> -1, bet 2 needs 2: W -> +1 reset
    expect(stakes("oscar", [L, L, W, W])).toEqual([1, 1, 1, 2, 1]);
  });
  it("fixed percentage scales with bankroll", () => {
    const s = createStrategy("percentage", { baseBet: 1, percent: 0.05 });
    expect(s.nextStake({ ...ctx, bankroll: 1000 })).toBe(50);
    expect(s.nextStake({ ...ctx, bankroll: 10 })).toBe(1); // never below the minimum
  });
  it("scripted progression tracks bankroll", () => {
    const rows = scriptedProgression("martingale", { baseBet: 5 }, ["L", "L", "W"], 100);
    expect(rows.map((r) => r.stake)).toEqual([5, 10, 20]);
    expect(rows.at(-1)!.bankroll).toBe(105);
  });
});
