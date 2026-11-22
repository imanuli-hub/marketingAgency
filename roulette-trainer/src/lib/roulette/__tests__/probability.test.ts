import { describe, expect, it } from "vitest";
import * as B from "../bets";
import { DEFAULT_RULES, type TableRules } from "../engine";
import { betMath, layoutMath, probLosingStreak } from "../probability";

const EU: TableRules = { ...DEFAULT_RULES, wheel: "european", evenMoneyRule: "none" };
const US: TableRules = { ...DEFAULT_RULES, wheel: "american", evenMoneyRule: "none" };

describe("expected value", () => {
  it("every European bet has a 2.70% house edge", () => {
    for (const s of B.allBetSpecs("european")) expect(betMath(s, EU).houseEdge).toBeCloseTo(1 / 37, 12);
  });
  it("every American bet has 5.26% edge except the basket (7.89%)", () => {
    for (const s of B.allBetSpecs("american")) {
      expect(betMath(s, US).houseEdge).toBeCloseTo(s.kind === "basket" ? 3 / 38 : 2 / 38, 12);
    }
  });
  it("La Partage halves the edge on even-money bets only", () => {
    const r = { ...EU, evenMoneyRule: "laPartage" as const };
    expect(betMath(B.red(), r).houseEdge).toBeCloseTo(1 / 74, 12);
    expect(betMath(B.dozen(1), r).houseEdge).toBeCloseTo(1 / 37, 12);
  });
  it("En Prison (single imprisonment) edge is 19/1369", () => {
    expect(betMath(B.odd(), { ...EU, evenMoneyRule: "enPrison" }).houseEdge).toBeCloseTo(19 / 1369, 12);
  });
  it("probability and true odds", () => {
    const m = betMath(B.straight(7), EU);
    expect(m.pWin).toBeCloseTo(1 / 37);
    expect(m.trueOdds).toBe("36 to 1");
    expect(betMath(B.red(), US).pWin).toBeCloseTo(18 / 38);
  });
});

describe("layout math", () => {
  it("combined EV equals the sum of individual EVs", () => {
    const bets = [B.place(B.straight(17), 5), B.place(B.red(), 20), B.place(B.sixLine(1), 10)];
    const lm = layoutMath(bets, EU);
    expect(lm.ev).toBeCloseTo(-35 / 37, 10);
    expect(lm.totalStake).toBe(35);
    expect(lm.bestCase).toBe(5 * 35 - 20 - 10); // 17 is black: red and six line both lose
  });
  it("covering everything still loses on average", () => {
    const bets = B.allBetSpecs("european").filter((s) => s.kind === "straight").map((s) => B.place(s, 1));
    const lm = layoutMath(bets, EU);
    expect(lm.pAnyWin).toBe(1);
    expect(lm.pProfit).toBe(0);
    expect(lm.ev).toBeCloseTo(-1, 10);
  });
  it("En Prison EV accounts for the held stake", () => {
    const lm = layoutMath([B.place(B.red(), 37)], { ...EU, evenMoneyRule: "enPrison" });
    expect(lm.ev).toBeCloseTo(-37 * (19 / 1369), 10);
  });
});

describe("losing streak probability", () => {
  it("matches brute force enumeration", () => {
    const p = 0.6, k = 3, n = 8;
    let total = 0;
    for (let mask = 0; mask < 1 << n; mask++) {
      let streak = 0, hit = false, prob = 1;
      for (let i = 0; i < n; i++) {
        const loss = (mask >> i) & 1;
        prob *= loss ? p : 1 - p;
        streak = loss ? streak + 1 : 0;
        if (streak >= k) hit = true;
      }
      if (hit) total += prob;
    }
    expect(probLosingStreak(p, k, n)).toBeCloseTo(total, 12);
  });
});
