import { describe, expect, it } from "vitest";
import * as B from "../bets";
import { DOUBLE_ZERO } from "../wheel";

describe("bet payouts", () => {
  it.each([
    ["straight", 35], ["split", 17], ["street", 11], ["trio", 11], ["corner", 8], ["firstFour", 8],
    ["basket", 6], ["sixLine", 5], ["dozen", 2], ["column", 2], ["red", 1], ["black", 1],
    ["odd", 1], ["even", 1], ["low", 1], ["high", 1],
  ] as const)("%s pays %i:1", (kind, payout) => {
    expect(B.PAYOUTS[kind]).toBe(payout);
  });

  it("payout odds are consistent with coverage on a 36-number fair game", () => {
    // For standard bets, (payout + 1) * numbersCovered === 36.
    for (const s of B.allBetSpecs("european")) {
      if (s.kind === "firstFour") continue; // 0-1-2-3 pays 8:1 on 4 numbers
      expect((s.payout + 1) * s.numbers.length).toBe(36);
    }
  });
});

describe("bet builders", () => {
  it("covers the right numbers", () => {
    expect(B.street(7).numbers).toEqual([7, 8, 9]);
    expect(B.corner(1).numbers).toEqual([1, 2, 4, 5]);
    expect(B.sixLine(31).numbers).toEqual([31, 32, 33, 34, 35, 36]);
    expect(B.dozen(3).numbers).toEqual(Array.from({ length: 12 }, (_, i) => 25 + i));
    expect(B.column(1).numbers.slice(0, 4)).toEqual([1, 4, 7, 10]);
    expect(B.column(3).numbers.at(-1)).toBe(36);
    expect(B.red().numbers).toHaveLength(18);
    expect(B.black().numbers).toHaveLength(18);
    expect(B.red().numbers.some((n) => B.black().numbers.includes(n))).toBe(false);
    expect(B.low().numbers).toHaveLength(18);
    expect(B.even().numbers.every((n) => n % 2 === 0)).toBe(true);
    expect(B.firstFour().numbers).toEqual([0, 1, 2, 3]);
    expect(B.basket().numbers).toEqual([0, DOUBLE_ZERO, 1, 2, 3]);
  });

  it("no outside bet covers zero or double zero", () => {
    for (const s of [B.red(), B.black(), B.odd(), B.even(), B.low(), B.high(), B.dozen(1), B.column(1)]) {
      expect(s.numbers).not.toContain(0);
      expect(s.numbers).not.toContain(DOUBLE_ZERO);
    }
  });

  it("validates splits", () => {
    expect(B.split(1, 2).numbers).toEqual([1, 2]);
    expect(B.split(4, 1).key).toBe("split:1-4");
    expect(() => B.split(3, 4)).toThrow(B.InvalidBetError); // different streets
    expect(() => B.split(1, 5)).toThrow();
    expect(B.split(0, 2).numbers).toEqual([0, 2]);
    expect(() => B.split(0, 4)).toThrow();
    expect(() => B.split(0, DOUBLE_ZERO, "european")).toThrow();
    expect(B.split(0, DOUBLE_ZERO, "american").numbers).toEqual([0, DOUBLE_ZERO]);
  });

  it("rejects invalid inside bets", () => {
    expect(() => B.street(2)).toThrow();
    expect(() => B.corner(3)).toThrow();
    expect(() => B.corner(33)).toThrow();
    expect(() => B.sixLine(34)).toThrow();
    expect(() => B.straight(DOUBLE_ZERO, "european")).toThrow();
    expect(() => B.straight(37 + 1, "american")).toThrow();
    expect(() => B.firstFour("american")).toThrow();
    expect(() => B.basket("european")).toThrow();
    expect(() => B.trio([0, 1, 3])).toThrow();
  });

  it("enumerates the full layout", () => {
    const count = (w: "european" | "american", k: B.BetKind) => B.allBetSpecs(w).filter((s) => s.kind === k).length;
    expect(count("european", "straight")).toBe(37);
    expect(count("american", "straight")).toBe(38);
    expect(count("european", "split")).toBe(57 + 3);
    expect(count("european", "street")).toBe(12);
    expect(count("european", "corner")).toBe(22);
    expect(count("european", "sixLine")).toBe(11);
    const keys = B.allBetSpecs("american").map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
