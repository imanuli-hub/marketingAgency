import { isEvenMoney, type BetSpec, type PlacedBet } from "./bets";
import { effectiveEvenMoneyRule, round2, settle, type TableRules } from "./engine";
import { allPockets, pocketCount } from "./wheel";

export interface BetMath {
  /** Probability the bet wins outright. */
  pWin: number;
  /** Probability of losing the full stake (eventually, including prison losses). */
  pLose: number;
  /** Net payout "X to 1". */
  payout: number;
  /** Expected value per 1 unit staked (negative = house edge). */
  ev: number;
  /** House edge as a positive fraction of the stake. */
  houseEdge: number;
  /** Variance of the net result per 1 unit staked. */
  variance: number;
  sd: number;
  /** "True odds" against the bet: (losing outcomes) to (winning outcomes). */
  trueOdds: string;
}

/** Exact per-unit statistics for a single bet under the given rules. */
export function betMath(spec: Pick<BetSpec, "numbers" | "payout" | "kind">, rules: TableRules): BetMath {
  const n = pocketCount(rules.wheel);
  const k = spec.numbers.length;
  const pWin = k / n;
  const rule = effectiveEvenMoneyRule(rules);
  // Outcome list: [probability, net result per unit]
  const outcomes: [number, number][] = [[pWin, spec.payout]];
  if (isEvenMoney(spec.kind) && rule !== "none") {
    const pZero = 1 / n;
    const pOther = 1 - pWin - pZero;
    outcomes.push([pOther, -1]);
    if (rule === "laPartage") {
      outcomes.push([pZero, -0.5]);
    } else {
      // En prison: next spin a win returns the stake (net 0); anything else loses it.
      outcomes.push([pZero * pWin, 0]);
      outcomes.push([pZero * (1 - pWin), -1]);
    }
  } else {
    outcomes.push([1 - pWin, -1]);
  }
  const ev = outcomes.reduce((s, [p, x]) => s + p * x, 0);
  const variance = outcomes.reduce((s, [p, x]) => s + p * (x - ev) ** 2, 0);
  const pLose = outcomes.filter(([, x]) => x === -1).reduce((s, [p]) => s + p, 0);
  return {
    pWin,
    pLose,
    payout: spec.payout,
    ev,
    houseEdge: -ev,
    variance,
    sd: Math.sqrt(variance),
    trueOdds: `${n - k} to ${k}`,
  };
}

export interface LayoutMath {
  totalStake: number;
  /** Probability at least one bet wins. */
  pAnyWin: number;
  /** Probability the spin ends with a net profit. */
  pProfit: number;
  /** Probability the spin ends with a net loss. */
  pLoss: number;
  /** Exact expected net result for the spin (money). */
  ev: number;
  /** ev / totalStake (negative). */
  evPct: number;
  variance: number;
  sd: number;
  bestCase: number;
  worstCase: number;
  /** Fraction of pockets covered by at least one bet. */
  coverage: number;
  /** Net result for each pocket (immediate settlement; en-prison stakes counted as held). */
  perPocket: { pocket: number; net: number }[];
}

/** Exact distribution of a combination of bets for one spin. */
export function layoutMath(bets: readonly PlacedBet[], rules: TableRules): LayoutMath {
  const pockets = allPockets(rules.wheel);
  const n = pockets.length;
  const stake = round2(bets.reduce((s, b) => s + b.amount, 0));
  const perPocket = pockets.map((pocket) => ({ pocket, net: settle(bets, pocket, rules).net }));
  const covered = new Set(bets.flatMap((b) => b.numbers));

  // Exact EV: imprisoned stakes come back with probability pWin on the next spin.
  let ev = 0;
  let second = 0;
  for (const { pocket, net } of perPocket) {
    const s = settle(bets, pocket, rules);
    const prisonBack = s.imprisoned.reduce((acc, b) => acc + b.amount * (b.numbers.length / n), 0);
    ev += (net + prisonBack) / n;
    second += (net + prisonBack) ** 2 / n;
  }
  const variance = Math.max(0, second - ev * ev);
  const nets = perPocket.map((p) => p.net);
  return {
    totalStake: stake,
    pAnyWin: covered.size / n,
    pProfit: nets.filter((x) => x > 1e-9).length / n,
    pLoss: nets.filter((x) => x < -1e-9).length / n,
    ev,
    evPct: stake > 0 ? ev / stake : 0,
    variance,
    sd: Math.sqrt(variance),
    bestCase: stake > 0 ? Math.max(...nets) : 0,
    worstCase: stake > 0 ? Math.min(...nets) : 0,
    coverage: covered.size / n,
    perPocket,
  };
}

/** Probability of a run of at least `k` consecutive losses somewhere in `spins` trials. */
export function probLosingStreak(pLoss: number, k: number, spins: number): number {
  if (k <= 0) return 1;
  if (spins < k) return 0;
  // DP over current streak length (states 0..k-1), absorbing state = streak reached.
  let state = new Array<number>(k).fill(0);
  state[0] = 1;
  let absorbed = 0;
  for (let i = 0; i < spins; i++) {
    const next = new Array<number>(k).fill(0);
    for (let s = 0; s < k; s++) {
      const p = state[s];
      if (!p) continue;
      next[0] += p * (1 - pLoss);
      if (s + 1 === k) absorbed += p * pLoss;
      else next[s + 1] += p * pLoss;
    }
    state = next;
  }
  return absorbed;
}

export const HOUSE_EDGE = {
  european: 1 / 37,
  american: 2 / 38,
  europeanLaPartageEvenMoney: 0.5 / 37,
  americanBasket: 1 - (5 * 7) / 38,
};

/**
 * Gambler's-ruin probability of gaining `up` units before losing `down` units
 * with flat 1-unit bets that win with probability p (even money, no push).
 */
export function probReachBefore(p: number, up: number, down: number): number {
  const q = 1 - p;
  if (Math.abs(p - q) < 1e-12) return down / (up + down);
  const r = q / p;
  return (1 - r ** down) / (1 - r ** (up + down));
}
