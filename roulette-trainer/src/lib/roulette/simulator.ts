import * as B from "./bets";
import type { BetSpec, BetKind } from "./bets";
import { effectiveEvenMoneyRule, maxForBet, type TableRules } from "./engine";
import { betMath } from "./probability";
import { seededRng } from "./rng";
import { histogram, mean, meanCI, quantile, wilson, type Bin } from "./stats";
import { createStrategy, type StrategyId, type StrategyParams } from "./strategies";
import { allPockets, isZero, type WheelType } from "./wheel";

export type TargetId = "red" | "black" | "even" | "odd" | "low" | "high" | "dozen" | "column" | "sixLine" | "corner" | "split" | "straight";

export const TARGETS: { id: TargetId; label: string }[] = [
  { id: "red", label: "Red (1:1)" },
  { id: "black", label: "Black (1:1)" },
  { id: "even", label: "Even (1:1)" },
  { id: "odd", label: "Odd (1:1)" },
  { id: "low", label: "1–18 (1:1)" },
  { id: "high", label: "19–36 (1:1)" },
  { id: "dozen", label: "2nd Dozen (2:1)" },
  { id: "column", label: "2nd Column (2:1)" },
  { id: "sixLine", label: "Six Line 19–24 (5:1)" },
  { id: "corner", label: "Corner 17/18/20/21 (8:1)" },
  { id: "split", label: "Split 17/20 (17:1)" },
  { id: "straight", label: "Straight 17 (35:1)" },
];

export function targetSpec(t: TargetId, wheel: WheelType): BetSpec {
  switch (t) {
    case "red": return B.red();
    case "black": return B.black();
    case "even": return B.even();
    case "odd": return B.odd();
    case "low": return B.low();
    case "high": return B.high();
    case "dozen": return B.dozen(2);
    case "column": return B.column(2);
    case "sixLine": return B.sixLine(19);
    case "corner": return B.corner(17);
    case "split": return B.split(17, 20, wheel);
    case "straight": return B.straight(17, wheel);
  }
}

interface Component {
  fraction: number;
  payout: number;
  kind: BetKind;
  covers: Uint8Array;
  evenMoney: boolean;
  edge: number;
}

/** The bets actually staked each spin, as fractions of the total stake. */
export function strategyLayout(strategy: StrategyId, target: TargetId, wheel: WheelType): { spec: BetSpec; fraction: number }[] {
  if (strategy === "mixed") {
    return [
      { spec: B.black(), fraction: 3 / 5 },
      { spec: B.sixLine(1), fraction: 1 / 5 },
      { spec: B.straight(0, wheel), fraction: 1 / 5 },
    ];
  }
  return [{ spec: targetSpec(target, wheel), fraction: 1 }];
}

function buildComponents(strategy: StrategyId, target: TargetId, rules: TableRules): Component[] {
  const pockets = allPockets(rules.wheel);
  return strategyLayout(strategy, target, rules.wheel).map(({ spec, fraction }) => {
    const covers = new Uint8Array(pockets.length);
    pockets.forEach((p, i) => { covers[i] = spec.numbers.includes(p) ? 1 : 0; });
    return { fraction, payout: spec.payout, kind: spec.kind, covers, evenMoney: B.isEvenMoney(spec.kind), edge: betMath(spec, rules).houseEdge };
  });
}

export interface SimConfig {
  rules: TableRules;
  strategy: StrategyId;
  params: StrategyParams;
  target: TargetId;
  bankroll: number;
  /** Maximum spins per session. */
  spins: number;
  sessions: number;
  /** Stop when cumulative loss reaches this amount (money). 0/undefined = none. */
  stopLoss?: number;
  /** Stop when profit reaches this amount (money). 0/undefined = none. */
  stopWin?: number;
  /** What to do when the progression demands more than the table maximum. */
  onLimit?: "reset" | "cap";
  seed: string | number;
  /** How many sessions to record full bankroll paths for. */
  recordPaths?: number;
}

export interface SessionResult {
  endBankroll: number;
  profit: number;
  spinsPlayed: number;
  wagered: number;
  theoreticalLoss: number;
  maxDrawdown: number;
  longestLosingStreak: number;
  winningSpins: number;
  losingSpins: number;
  busted: boolean;
  hitStopLoss: boolean;
  hitStopWin: boolean;
  limitHits: number;
  biggestStake: number;
  path?: number[];
}

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Run one session. Spin outcomes depend only on (seed, sessionIndex). */
export function runSession(config: SimConfig, sessionIndex: number, recordPath = false): SessionResult {
  const { rules } = config;
  const n = rules.wheel === "european" ? 37 : 38;
  const pockets = allPockets(rules.wheel);
  const comps = buildComponents(config.strategy, config.target, rules);
  const rule = effectiveEvenMoneyRule(rules);
  const rng = seededRng(`${config.seed}:${sessionIndex}`);
  const prisonRng = seededRng(`${config.seed}:${sessionIndex}:prison`);
  const strategy = createStrategy(config.strategy, config.params);
  const payout = comps[0].payout;

  // Largest total stake allowed by the per-position table maximums.
  const limitCap = Math.min(...comps.map((c) => maxForBet({ kind: c.kind }, rules) / c.fraction));
  // Smallest total stake that keeps every position at or above the table minimum.
  const minTotal = Math.max(...comps.map((c) => rules.minBet / c.fraction));
  const floorLevel = config.stopLoss ? config.bankroll - config.stopLoss : 0;
  const edgePerUnit = comps.reduce((s, c) => s + c.fraction * c.edge, 0);

  let bankroll = config.bankroll;
  let peak = bankroll;
  let maxDD = 0;
  let streak = 0;
  let longest = 0;
  let wagered = 0;
  let wins = 0;
  let losses = 0;
  let limitHits = 0;
  let biggest = 0;
  let spins = 0;
  let busted = false;
  let hitStopLoss = false;
  let hitStopWin = false;
  const path: number[] | undefined = recordPath ? [bankroll] : undefined;
  const pathStep = Math.max(1, Math.ceil(config.spins / 400));

  while (spins < config.spins) {
    if (config.stopWin && bankroll >= config.bankroll + config.stopWin - 1e-9) { hitStopWin = true; break; }
    if (config.stopLoss && bankroll <= floorLevel + 1e-9) { hitStopLoss = true; break; }

    const ctx = { bankroll, minBet: rules.minBet, payout };
    let stake = strategy.nextStake(ctx);
    if (stake > limitCap + 1e-9) {
      limitHits++;
      if (config.onLimit === "cap") stake = limitCap;
      else { strategy.reset(); stake = Math.min(strategy.nextStake(ctx), limitCap); }
    }
    // Never stake more than is available above the stop-loss floor.
    const available = bankroll - floorLevel;
    if (stake > available) stake = Math.floor(available / rules.minBet) * rules.minBet;
    stake = r2(Math.max(stake, 0));
    if (stake < minTotal - 1e-9) {
      if (config.stopLoss && floorLevel > 0) hitStopLoss = true;
      else busted = true;
      break;
    }

    const idx = rng.nextInt(n);
    const zero = isZero(pockets[idx]);
    let net = 0;
    for (const c of comps) {
      const amt = stake * c.fraction;
      if (c.covers[idx]) net += amt * c.payout;
      else if (zero && c.evenMoney && rule === "laPartage") net -= amt / 2;
      else if (zero && c.evenMoney && rule === "enPrison") net += c.covers[prisonRng.nextInt(n)] ? 0 : -amt;
      else net -= amt;
    }
    net = r2(net);
    bankroll = r2(bankroll + net);
    wagered += stake;
    biggest = Math.max(biggest, stake);
    spins++;
    strategy.record(net, { ...ctx, bankroll });

    if (net > 0) { wins++; streak = 0; }
    else if (net < 0) { losses++; streak++; longest = Math.max(longest, streak); }
    if (bankroll > peak) peak = bankroll;
    maxDD = Math.max(maxDD, peak - bankroll);
    if (path && (spins % pathStep === 0)) path.push(bankroll);
  }
  if (path && path[path.length - 1] !== bankroll) path.push(bankroll);
  if (!busted && bankroll < minTotal && !hitStopLoss && !hitStopWin && spins < config.spins) busted = true;

  return {
    endBankroll: bankroll,
    profit: r2(bankroll - config.bankroll),
    spinsPlayed: spins,
    wagered: r2(wagered),
    theoreticalLoss: r2(wagered * edgePerUnit),
    maxDrawdown: r2(maxDD),
    longestLosingStreak: longest,
    winningSpins: wins,
    losingSpins: losses,
    busted,
    hitStopLoss,
    hitStopWin,
    limitHits,
    biggestStake: biggest,
    path,
  };
}

export interface SimSummary {
  config: SimConfig;
  sessions: number;
  meanEnd: number;
  medianEnd: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  minEnd: number;
  maxEnd: number;
  meanProfit: number;
  pAhead: number;
  pBehind: number;
  pBust: number;
  pStopWin: number;
  pStopLoss: number;
  meanMaxDrawdown: number;
  worstDrawdown: number;
  meanLongestLosingStreak: number;
  longestLosingStreak: number;
  totalWagered: number;
  meanWagered: number;
  theoreticalLoss: number;
  actualLoss: number;
  meanSpins: number;
  limitHitRate: number;
  /** Fraction of spins that were winning spins (NOT a profitability measure). */
  spinWinRate: number;
  histogram: Bin[];
  paths: number[][];
  /** Mean of the best 90% / worst 10% of outcomes — shows the hidden tail. */
  meanProfitWhenAhead: number;
  meanLossWhenBehind: number;
  /** Sessions that hit neither stop rule before the spin cap. */
  pNeither: number;
  /** 95% confidence intervals (simulation uncertainty, not a forecast). */
  ci: { pAhead: [number, number]; pStopWin: [number, number]; pStopLoss: [number, number]; pBust: [number, number]; meanProfit: [number, number] };
  /** Average loss once a session hits its stop-loss or busts. */
  meanLossOnStop: number;
}

export function summarize(config: SimConfig, results: SessionResult[]): SimSummary {
  const ends = results.map((r) => r.endBankroll);
  const profits = results.map((r) => r.profit);
  const n = results.length || 1;
  const ahead = results.filter((r) => r.profit > 0);
  const behind = results.filter((r) => r.profit < 0);
  const totalWagered = results.reduce((s, r) => s + r.wagered, 0);
  const totalSpins = results.reduce((s, r) => s + r.spinsPlayed, 0);
  const winSpins = results.reduce((s, r) => s + r.winningSpins, 0);
  return {
    config,
    sessions: results.length,
    meanEnd: mean(ends),
    medianEnd: quantile(ends, 0.5),
    p5: quantile(ends, 0.05),
    p25: quantile(ends, 0.25),
    p75: quantile(ends, 0.75),
    p95: quantile(ends, 0.95),
    minEnd: Math.min(...ends),
    maxEnd: Math.max(...ends),
    meanProfit: mean(profits),
    pAhead: ahead.length / n,
    pBehind: behind.length / n,
    pBust: results.filter((r) => r.busted).length / n,
    pStopWin: results.filter((r) => r.hitStopWin).length / n,
    pStopLoss: results.filter((r) => r.hitStopLoss).length / n,
    meanMaxDrawdown: mean(results.map((r) => r.maxDrawdown)),
    worstDrawdown: Math.max(0, ...results.map((r) => r.maxDrawdown)),
    meanLongestLosingStreak: mean(results.map((r) => r.longestLosingStreak)),
    longestLosingStreak: Math.max(0, ...results.map((r) => r.longestLosingStreak)),
    totalWagered: r2(totalWagered),
    meanWagered: totalWagered / n,
    theoreticalLoss: r2(results.reduce((s, r) => s + r.theoreticalLoss, 0)),
    actualLoss: r2(-profits.reduce((s, x) => s + x, 0)),
    meanSpins: totalSpins / n,
    limitHitRate: results.filter((r) => r.limitHits > 0).length / n,
    spinWinRate: totalSpins ? winSpins / totalSpins : 0,
    histogram: histogram(profits, 30),
    paths: results.filter((r) => r.path).map((r) => r.path!),
    meanProfitWhenAhead: mean(ahead.map((r) => r.profit)),
    meanLossWhenBehind: mean(behind.map((r) => r.profit)),
    pNeither: results.filter((r) => !r.hitStopWin && !r.hitStopLoss && !r.busted).length / n,
    ci: {
      pAhead: wilson(ahead.length, results.length),
      pStopWin: wilson(results.filter((r) => r.hitStopWin).length, results.length),
      pStopLoss: wilson(results.filter((r) => r.hitStopLoss).length, results.length),
      pBust: wilson(results.filter((r) => r.busted).length, results.length),
      meanProfit: meanCI(profits),
    },
    meanLossOnStop: mean(results.filter((r) => r.hitStopLoss || r.busted).map((r) => r.profit)),
  };
}

/** Monte Carlo over many independent sessions. `onProgress` receives 0..1. */
export function monteCarlo(config: SimConfig, onProgress?: (p: number) => void): SimSummary {
  const results: SessionResult[] = [];
  const keepPaths = config.recordPaths ?? 20;
  const every = Math.max(1, Math.floor(config.sessions / 50));
  for (let i = 0; i < config.sessions; i++) {
    results.push(runSession(config, i, i < keepPaths));
    if (onProgress && i % every === 0) onProgress(i / config.sessions);
  }
  onProgress?.(1);
  return summarize(config, results);
}

/** Run several strategies against the identical spin sequences (same seed). */
export function compareStrategies(
  base: Omit<SimConfig, "strategy">,
  strategies: StrategyId[],
  onProgress?: (p: number) => void,
): SimSummary[] {
  return strategies.map((strategy, i) =>
    monteCarlo({ ...base, strategy }, (p) => onProgress?.((i + p) / strategies.length)),
  );
}
