import { INSIDE_KINDS, isEvenMoney, type BetSpec, type PlacedBet } from "./bets";
import { isZero, pocketCount, wheelOrder, type Pocket, type WheelType } from "./wheel";
import type { Rng } from "./rng";

/** How even-money bets are treated when the ball lands on zero (European only). */
export type EvenMoneyRule = "none" | "laPartage" | "enPrison";

export interface TableRules {
  wheel: WheelType;
  evenMoneyRule: EvenMoneyRule;
  /** Minimum stake on any single bet position. */
  minBet: number;
  /** Maximum stake on a single inside position (straight, split…). */
  maxInside: number;
  /** Maximum stake on a single outside position (dozen, red…). */
  maxOutside: number;
}

export const DEFAULT_RULES: TableRules = {
  wheel: "european",
  evenMoneyRule: "none",
  minBet: 1,
  maxInside: 100,
  maxOutside: 500,
};

/** La Partage / En Prison only exist on single-zero wheels. */
export function effectiveEvenMoneyRule(rules: TableRules): EvenMoneyRule {
  return rules.wheel === "european" ? rules.evenMoneyRule : "none";
}

export const round2 = (x: number) => Math.round(x * 100) / 100;

export function totalStake(bets: readonly PlacedBet[]): number {
  return round2(bets.reduce((s, b) => s + b.amount, 0));
}

export function maxForBet(spec: Pick<BetSpec, "kind">, rules: TableRules): number {
  return INSIDE_KINDS.has(spec.kind) ? rules.maxInside : rules.maxOutside;
}

/** Add `amount` to a bet position, stacking with an existing bet on the same key. */
export function addBet(bets: readonly PlacedBet[], spec: BetSpec, amount: number): PlacedBet[] {
  const idx = bets.findIndex((b) => b.key === spec.key);
  if (idx === -1) return [...bets, { ...spec, amount: round2(amount) }];
  return bets.map((b, i) => (i === idx ? { ...b, amount: round2(b.amount + amount) } : b));
}

export type ValidationCode = "stakePositive" | "belowMin" | "aboveMax" | "noDoubleZero" | "notAvailable" | "overBalance";

export interface ValidationIssue {
  key?: string;
  code: ValidationCode;
  /** Values for the localized message (label, limit, total, balance). */
  params: Record<string, string | number>;
  /** English fallback message. */
  message: string;
}

/** Check bets against table limits and the available balance. */
export function validateBets(
  bets: readonly PlacedBet[],
  rules: TableRules,
  balance: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const b of bets) {
    const label = b.label;
    if (!(b.amount > 0)) issues.push({ key: b.key, code: "stakePositive", params: { label }, message: `${label}: stake must be positive` });
    if (b.amount < rules.minBet) issues.push({ key: b.key, code: "belowMin", params: { label, limit: rules.minBet }, message: `${label}: below table minimum of ${rules.minBet}` });
    const max = maxForBet(b, rules);
    if (b.amount > max) issues.push({ key: b.key, code: "aboveMax", params: { label, limit: max }, message: `${label}: above table maximum of ${max}` });
    if (b.numbers.some((n) => n === 37) && rules.wheel !== "american") {
      issues.push({ key: b.key, code: "noDoubleZero", params: { label }, message: `${label}: 00 does not exist on a European wheel` });
    }
    if ((b.kind === "basket" && rules.wheel !== "american") || (b.kind === "firstFour" && rules.wheel !== "european")) {
      issues.push({ key: b.key, code: "notAvailable", params: { label }, message: `${label}: not available on this wheel` });
    }
  }
  const total = totalStake(bets);
  if (total > balance + 1e-9) issues.push({ code: "overBalance", params: { total, balance: round2(balance) }, message: `Total stake ${total} exceeds balance ${round2(balance)}` });
  return issues;
}

/**
 * Multiply all bets by `factor` (used by "double"). Returns null if the
 * result would break a table limit or exceed the balance.
 */
export function scaleBets(
  bets: readonly PlacedBet[],
  factor: number,
  rules: TableRules,
  balance: number,
): PlacedBet[] | null {
  const scaled = bets.map((b) => ({ ...b, amount: round2(b.amount * factor) }));
  return validateBets(scaled, rules, balance).length === 0 ? scaled : null;
}

export type OutcomeStatus = "win" | "lose" | "halfBack" | "imprisoned" | "released" | "prisonLost";

export interface BetOutcome {
  bet: PlacedBet;
  status: OutcomeStatus;
  /** Money returned to the player this spin (stake + winnings, if any). */
  returned: number;
  /** Profit relative to the stake, for display. Imprisoned bets show -stake until released. */
  net: number;
}

export interface SpinSettlement {
  pocket: Pocket;
  outcomes: BetOutcome[];
  /** Stake newly committed this spin (excludes bets already in prison). */
  staked: number;
  returned: number;
  /** returned - staked. Change in the player's balance for this spin. */
  net: number;
  /** Even-money bets held "en prison" for the next spin. */
  imprisoned: PlacedBet[];
}

/**
 * Settle a set of bets against a winning pocket.
 *
 * Accounting model: the stake for `bets` is deducted from the balance when the
 * spin starts; `returned` is credited afterwards. Bets carried over in
 * `prison` were already deducted on the previous spin.
 */
export function settle(
  bets: readonly PlacedBet[],
  pocket: Pocket,
  rules: TableRules,
  prison: readonly PlacedBet[] = [],
): SpinSettlement {
  const rule = effectiveEvenMoneyRule(rules);
  const zero = isZero(pocket);
  const outcomes: BetOutcome[] = [];
  const imprisoned: PlacedBet[] = [];

  for (const bet of bets) {
    if (bet.numbers.includes(pocket)) {
      const returned = round2(bet.amount * (bet.payout + 1));
      outcomes.push({ bet, status: "win", returned, net: round2(returned - bet.amount) });
    } else if (zero && isEvenMoney(bet.kind) && rule === "laPartage") {
      const returned = round2(bet.amount / 2);
      outcomes.push({ bet, status: "halfBack", returned, net: round2(returned - bet.amount) });
    } else if (zero && isEvenMoney(bet.kind) && rule === "enPrison") {
      imprisoned.push(bet);
      outcomes.push({ bet, status: "imprisoned", returned: 0, net: -bet.amount });
    } else {
      outcomes.push({ bet, status: "lose", returned: 0, net: -bet.amount });
    }
  }

  // Bets held from the previous spin: a win releases the original stake only.
  // A loss - or a second zero (single-imprisonment rule) - loses the stake.
  for (const bet of prison) {
    if (bet.numbers.includes(pocket)) {
      outcomes.push({ bet, status: "released", returned: bet.amount, net: 0 });
    } else {
      outcomes.push({ bet, status: "prisonLost", returned: 0, net: -bet.amount });
    }
  }

  const staked = totalStake(bets);
  const returned = round2(outcomes.reduce((s, o) => s + o.returned, 0));
  return { pocket, outcomes, staked, returned, net: round2(returned - staked), imprisoned };
}

/** Draw a winning pocket uniformly at random. The wheel animation must use this value. */
export function spinPocket(wheel: WheelType, rng: Rng): Pocket {
  const order = wheelOrder(wheel);
  return order[rng.nextInt(pocketCount(wheel))];
}
