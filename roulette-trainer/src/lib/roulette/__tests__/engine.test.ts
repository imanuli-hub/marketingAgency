import { describe, expect, it } from "vitest";
import * as B from "../bets";
import { DEFAULT_RULES, addBet, scaleBets, settle, spinPocket, totalStake, validateBets, type TableRules } from "../engine";
import { seededRng } from "../rng";
import { DOUBLE_ZERO, allPockets } from "../wheel";

const EU: TableRules = { ...DEFAULT_RULES, wheel: "european", evenMoneyRule: "none" };
const US: TableRules = { ...DEFAULT_RULES, wheel: "american", evenMoneyRule: "none" };

describe("settlement of every bet on every pocket", () => {
  for (const rules of [EU, US]) {
    it(`${rules.wheel}: winners get stake × (payout + 1), losers get nothing`, () => {
      for (const spec of B.allBetSpecs(rules.wheel)) {
        const bet = B.place(spec, 10);
        for (const pocket of allPockets(rules.wheel)) {
          const s = settle([bet], pocket, rules);
          const wins = spec.numbers.includes(pocket);
          expect(s.returned).toBe(wins ? 10 * (spec.payout + 1) : 0);
          expect(s.net).toBe(wins ? 10 * spec.payout : -10);
          expect(s.outcomes[0].status).toBe(wins ? "win" : "lose");
        }
      }
    });
  }
});

describe("zero and double zero", () => {
  it("outside bets lose on 0 and 00 without special rules", () => {
    const bets = [B.place(B.red(), 10), B.place(B.dozen(1), 10), B.place(B.column(1), 10), B.place(B.low(), 10)];
    expect(settle(bets, 0, EU).net).toBe(-40);
    expect(settle(bets, DOUBLE_ZERO, US).net).toBe(-40);
  });

  it("straight on 00 pays 35:1 on an American wheel", () => {
    expect(settle([B.place(B.straight(DOUBLE_ZERO, "american"), 5)], DOUBLE_ZERO, US).returned).toBe(180);
  });

  it("La Partage returns half of even-money bets on zero only", () => {
    const rules = { ...EU, evenMoneyRule: "laPartage" as const };
    const s = settle([B.place(B.red(), 10), B.place(B.dozen(1), 10)], 0, rules);
    expect(s.outcomes.map((o) => o.status)).toEqual(["halfBack", "lose"]);
    expect(s.returned).toBe(5);
    expect(s.net).toBe(-15);
    expect(settle([B.place(B.red(), 10)], 2, rules).net).toBe(-10); // 2 is black
  });

  it("La Partage / En Prison are ignored on an American wheel", () => {
    const s = settle([B.place(B.red(), 10)], 0, { ...US, evenMoneyRule: "laPartage" });
    expect(s.net).toBe(-10);
  });

  it("En Prison holds the bet and releases the stake on a win", () => {
    const rules = { ...EU, evenMoneyRule: "enPrison" as const };
    const first = settle([B.place(B.black(), 10)], 0, rules);
    expect(first.imprisoned).toHaveLength(1);
    expect(first.net).toBe(-10);
    const win = settle([], 2, rules, first.imprisoned); // 2 is black
    expect(win.outcomes[0].status).toBe("released");
    expect(win.returned).toBe(10);
    const lose = settle([], 1, rules, first.imprisoned);
    expect(lose.outcomes[0].status).toBe("prisonLost");
    expect(lose.returned).toBe(0);
    const zeroAgain = settle([], 0, rules, first.imprisoned);
    expect(zeroAgain.returned).toBe(0);
  });
});

describe("bankroll accounting", () => {
  it("balance changes by returned - staked over a sequence of spins", () => {
    const rng = seededRng("accounting");
    let balance = 1000;
    for (let i = 0; i < 2000; i++) {
      const bets = [B.place(B.straight(17), 1), B.place(B.red(), 5), B.place(B.corner(1), 2)];
      const pocket = spinPocket("european", rng);
      balance -= totalStake(bets);
      const s = settle(bets, pocket, EU);
      balance += s.returned;
      const expected = (pocket === 17 ? 36 : 0) + (B.red().numbers.includes(pocket) ? 10 : 0) + ([1, 2, 4, 5].includes(pocket) ? 18 : 0);
      expect(s.returned).toBe(expected);
    }
    expect(Number.isFinite(balance)).toBe(true);
  });

  it("stacks chips on the same position", () => {
    let bets = addBet([], B.red(), 5);
    bets = addBet(bets, B.red(), 10);
    bets = addBet(bets, B.straight(7), 1);
    expect(bets).toHaveLength(2);
    expect(bets[0].amount).toBe(15);
    expect(totalStake(bets)).toBe(16);
  });
});

describe("table limits", () => {
  const rules: TableRules = { ...EU, minBet: 5, maxInside: 50, maxOutside: 200 };
  it("enforces minimum, inside maximum, outside maximum and balance", () => {
    expect(validateBets([B.place(B.red(), 2)], rules, 1000)[0].message).toMatch(/minimum/);
    expect(validateBets([B.place(B.straight(1), 60)], rules, 1000)[0].message).toMatch(/maximum/);
    expect(validateBets([B.place(B.red(), 150)], rules, 1000)).toHaveLength(0);
    expect(validateBets([B.place(B.red(), 250)], rules, 1000)[0].message).toMatch(/maximum/);
    expect(validateBets([B.place(B.red(), 150)], rules, 100)[0].message).toMatch(/balance/);
  });

  it("double respects limits and balance", () => {
    const bets = [B.place(B.straight(1), 30), B.place(B.red(), 20)];
    expect(scaleBets(bets, 2, rules, 1000)).toBeNull(); // 60 > inside max
    const ok = scaleBets([B.place(B.red(), 20)], 2, rules, 1000);
    expect(ok?.[0].amount).toBe(40);
    expect(scaleBets([B.place(B.red(), 20)], 2, rules, 30)).toBeNull();
  });

  it("rejects 00 bets on a European table", () => {
    expect(validateBets([B.place(B.straight(DOUBLE_ZERO, "american"), 5)], rules, 100)).not.toHaveLength(0);
  });
});
