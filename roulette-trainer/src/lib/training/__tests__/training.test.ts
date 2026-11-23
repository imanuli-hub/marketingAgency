import { describe, expect, it } from "vitest";
import { buildSessionReview } from "@/lib/analytics/review";
import type { SpinRecord } from "@/lib/coach/types";
import { DEFAULT_RULES } from "@/lib/roulette/engine";
import type { SessionRecord } from "@/store/app-store";
import { DEFAULT_PROFILE, settingsFromProfile, validateProfile } from "../profile";
import { currentDay, dayComplete, milestones } from "../program-state";
import { readinessReport } from "../readiness";
import { checkStopRules, stakeAllowance } from "../stop-rules";

const plan = { budget: 100, unit: 2, stopLoss: 20, stopWin: 10, timeLimitMins: 45, bettingSeconds: 20 };
function session(nets: number[], opts: Partial<SessionRecord> = {}, stake = 2): SessionRecord {
  let bal = 100;
  const spins: SpinRecord[] = nets.map((n, i) => {
    bal += n;
    return { pocket: 1, staked: stake, returned: stake + n, net: n, balanceAfter: bal, at: 1000 + i * 60_000, bets: [{ key: "red:x", kind: "red", amount: stake, won: n > 0 }] };
  });
  return {
    id: "s", mode: "practice", startedAt: 1000, endedAt: 1000 + nets.length * 60_000, wheel: "european", rules: DEFAULT_RULES,
    startBalance: 100, balance: bal, peak: 100, maxDrawdown: 0, spinCount: nets.length, wagered: nets.length * stake,
    theoreticalLoss: (nets.length * stake) / 37, winningSpins: nets.filter((n) => n > 0).length, losingSpins: nets.filter((n) => n < 0).length,
    biggestStake: stake, strategy: "flat", plan, spins, ...opts,
  };
}

describe("training profile", () => {
  it("defaults match the personal profile", () => {
    expect(DEFAULT_PROFILE).toMatchObject({ bankroll: 100, baseBet: 2, wheel: "european", profitTarget: 10, stopLoss: 20, strategy: "flat", sessionMinMins: 30, sessionMaxMins: 45 });
  });
  it("syncs every controlled setting", () => {
    const s = settingsFromProfile({ ...DEFAULT_PROFILE, bankroll: 150, baseBet: 3, stopLoss: 30, profitTarget: 15 });
    expect(s).toMatchObject({ startingBankroll: 150, practiceBaseBet: 3, practiceStopLoss: 30, practiceStopWin: 15, practiceStrategy: "flat" });
    expect(s.casinoPlan).toMatchObject({ budget: 150, unit: 3, stopLoss: 30, stopWin: 15, timeLimitMins: 45 });
  });
  it("validates inconsistent values", () => {
    expect(validateProfile(DEFAULT_PROFILE)).toEqual([]);
    expect(validateProfile({ ...DEFAULT_PROFILE, baseBet: 0 }).map((i) => i.code)).toContain("positive");
    expect(validateProfile({ ...DEFAULT_PROFILE, stopLoss: 200 }).map((i) => i.code)).toContain("stopLossVsBankroll");
    expect(validateProfile({ ...DEFAULT_PROFILE, sessionMinMins: 60 }).map((i) => i.code)).toContain("sessionRange");
  });
});

describe("stop rules", () => {
  const p = { stopLoss: 20, stopWin: 10, timeLimitMins: 45, minBet: 1 };
  it("fires at exactly the thresholds", () => {
    expect(checkStopRules(100, 81, 0, 0, p)).toBeNull();
    expect(checkStopRules(100, 80, 0, 0, p)).toBe("stopLoss");
    expect(checkStopRules(100, 109, 0, 0, p)).toBeNull();
    expect(checkStopRules(100, 110, 0, 0, p)).toBe("stopWin");
    expect(checkStopRules(100, 100, 0, 45 * 60_000, p)).toBe("timeLimit");
    expect(checkStopRules(5, 0.5, 0, 0, { ...p, stopLoss: 0 })).toBe("bankrupt");
  });
  it("0 disables a rule", () => {
    expect(checkStopRules(100, 10, 0, 0, { stopLoss: 0, stopWin: 0, minBet: 1 })).toBeNull();
  });
  it("stake allowance never lets a losing spin breach the stop-loss", () => {
    expect(stakeAllowance(100, 100, p)).toBe(20);
    expect(stakeAllowance(100, 85, p)).toBe(5);
    expect(stakeAllowance(100, 120, p)).toBe(40);
    expect(stakeAllowance(100, 80, p)).toBe(0);
    expect(stakeAllowance(100, 50, { stopLoss: 0 })).toBe(50);
    // Property: after losing the full allowance, net is never below −stopLoss.
    for (let bal = 80; bal <= 130; bal += 0.5) expect(bal - stakeAllowance(100, bal, p) - 100).toBeGreaterThanOrEqual(-20 - 1e-9);
  });
});

describe("lesson progression", () => {
  it("a day needs the lesson and a passed quiz", () => {
    expect(dayComplete(1, {}, {})).toBe(false);
    expect(dayComplete(1, { 1: 1 }, {})).toBe(false);
    expect(dayComplete(1, { 1: 1 }, { "day-1": { best: 2, total: 4 } })).toBe(false);
    expect(dayComplete(1, { 1: 1 }, { "day-1": { best: 3, total: 4 } })).toBe(true);
  });
  it("current day is the first incomplete day", () => {
    const q = { "day-1": { best: 4, total: 4 }, "day-2": { best: 4, total: 4 } };
    expect(currentDay({}, {})).toBe(1);
    expect(currentDay({ 1: 1, 2: 1 }, q)).toBe(3);
    expect(currentDay({ 1: 1, 3: 1 }, { ...q, "day-3": { best: 4, total: 4 } })).toBe(2);
  });
  it("day 14 requires all five final sections", () => {
    const finals = Object.fromEntries(["knowledge", "payouts", "strategy", "bankroll", "etiquette"].map((s) => [`final-${s}`, { best: 1, total: 5 }]));
    expect(dayComplete(14, { 14: 1 }, {})).toBe(false);
    expect(dayComplete(14, { 14: 1 }, finals)).toBe(true);
  });
  it("milestones count flat sessions and rehearsals", () => {
    const h = [session(Array(12).fill(-2)), session(Array(12).fill(2)), { ...session(Array(12).fill(2)), mode: "casino" as const }];
    const m = Object.fromEntries(milestones({}, {}, h, {}).map((x) => [x.id, x.done]));
    expect(m.flatSessions).toBe(2);
    expect(m.rehearsals).toBe(1);
  });
});

describe("session review", () => {
  it("computes accounting and variance", () => {
    const r = buildSessionReview(session([2, -2, -2, 2, 2]));
    expect(r.net).toBe(2);
    expect(r.wagered).toBe(10);
    expect(r.winningBets).toBe(3);
    expect(r.losingBets).toBe(2);
    expect(r.avgStake).toBe(2);
    expect(r.variance).toBeCloseTo(2 + 10 / 37, 2);
  });
  it("flags chasing and played-past-limit, and lowers discipline", () => {
    const rec = session([-2, -2]);
    rec.spins.push({ ...rec.spins[1], staked: 6, net: -6, balanceAfter: 90 });
    const r = buildSessionReview({ ...rec, balance: 90, spinCount: 3 });
    expect(r.warnings).toContain("chasing");
    expect(r.discipline).toBeLessThan(100);
    expect(r.recommendation.code).toBe("chasing");
    const past = buildSessionReview(session([...Array(10).fill(-2), -2]));
    expect(past.stopRules.playedPastLimit).toBe(true);
    expect(past.stopRules.lossExceeded).toBe(true);
  });
  it("tracks strategy adherence per spin", () => {
    const rec = session([-2, -2, -2]);
    rec.spins[0].strategyRequired = 2;
    rec.spins[1].strategyRequired = 2;
    rec.spins[2].strategyRequired = 4; // staked 2 instead of 4
    const r = buildSessionReview(rec);
    expect(r.strategy).toEqual({ checked: 3, followed: 2, rate: 2 / 3 });
    expect(r.warnings).toContain("strategyDeviation");
  });
  it("discipline does not reward profit or bigger stakes", () => {
    // Both stay inside the +10 / −20 band, so neither breaks a stop rule.
    const pattern = [2, 2, -2, 2, -2, 2, -2, -2, 2, -2, 2, 2];
    const win = buildSessionReview(session(pattern));
    const lose = buildSessionReview(session(pattern.map((n) => -n)));
    expect(win.net).toBe(4);
    expect(lose.net).toBe(-4);
    expect(win.discipline).toBe(100);
    expect(lose.discipline).toBe(100);
    const big = buildSessionReview(session(Array(12).fill(10), {}, 10));
    expect(big.discipline).toBeLessThan(100);
  });
});

describe("readiness report", () => {
  const finals = Object.fromEntries(["knowledge", "payouts", "strategy", "bankroll", "etiquette"].map((s) => [`final-${s}`, { best: 5, total: 5 }]));
  it("does not depend on whether sessions were profitable", () => {
    const winners = [1, 2, 3].map((i) => ({ ...session(Array(12).fill(1).map((_, k) => (k % 3 ? 2 : -2))), id: `w${i}`, startedAt: i }));
    const losers = [1, 2, 3].map((i) => ({ ...session(Array(12).fill(1).map((_, k) => (k % 3 ? -2 : 2))), id: `l${i}`, startedAt: i }));
    expect(readinessReport({}, finals, winners).score).toBeCloseTo(readinessReport({}, finals, losers).score, 10);
  });
  it("needs three sessions for full discipline credit", () => {
    const alt = Array.from({ length: 12 }, (_, k) => (k % 2 ? -2 : 2));
    const one = readinessReport({}, finals, [session(alt)]);
    const three = readinessReport({}, finals, [1, 2, 3].map((i) => ({ ...session(alt), id: String(i), startedAt: i })));
    expect(one.discipline).toBeCloseTo(1 / 3);
    expect(three.discipline).toBe(1);
    expect(three.score).toBeGreaterThan(one.score);
  });
});

import * as Bets from "@/lib/roulette/bets";
import { GUIDED_STEPS, matchesStep } from "../guided";
import { settle } from "@/lib/roulette/engine";

describe("guided practice steps", () => {
  it("answers equal the engine's settlement", () => {
    for (const st of GUIDED_STEPS) {
      const placed = st.bets.map((b) => Bets.place(b.spec, b.amount));
      if (st.id === "combo") expect(settle(placed, 17, DEFAULT_RULES).net).toBe(st.answer);
      else {
        const winning = st.bets[0].spec.numbers[0];
        const s = settle(placed, winning, DEFAULT_RULES);
        expect(s.returned - s.staked).toBe(st.answer);
      }
    }
  });
  it("matches only the exact target bets", () => {
    const st = GUIDED_STEPS.find((x) => x.id === "split")!;
    expect(matchesStep(st, [Bets.place(Bets.split(17, 20), 2)])).toBe(true);
    expect(matchesStep(st, [Bets.place(Bets.straight(17), 2)])).toBe(false);
    expect(matchesStep(st, [Bets.place(Bets.split(17, 20), 4)])).toBe(false);
  });
  it("has instructions in both languages", () => {
    for (const st of GUIDED_STEPS) {
      expect(st.instruction.he).toMatch(/[֐-׿]/);
      expect(st.question.en.length).toBeGreaterThan(10);
    }
  });
});
