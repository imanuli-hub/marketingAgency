/**
 * Betting systems as small state machines.
 *
 * IMPORTANT: none of these change the expected value of a bet. They only
 * reshape *when* and *how much* you win or lose. Every unit wagered still
 * carries the same house edge.
 */
export type StrategyId =
  | "flat"
  | "martingale"
  | "paroli"
  | "dalembert"
  | "fibonacci"
  | "labouchere"
  | "oscar"
  | "percentage"
  | "mixed";

export const STRATEGY_IDS: StrategyId[] = [
  "flat", "martingale", "paroli", "dalembert", "fibonacci", "labouchere", "oscar", "percentage", "mixed",
];

export interface StrategyParams {
  /** Base unit in money. */
  baseBet: number;
  /** Fixed-percentage strategy: fraction of current bankroll (e.g. 0.02). */
  percent?: number;
  /** Labouchère starting line, in units. */
  labouchereLine?: number[];
  /** Paroli: consecutive wins before banking profit and resetting. */
  paroliSteps?: number;
}

export interface StrategyContext {
  bankroll: number;
  minBet: number;
  /** Net payout of the bet this strategy is playing (1 for even money). */
  payout: number;
}

export interface Strategy {
  readonly id: StrategyId;
  /** Desired total stake for the next spin, before limits or bankroll capping. */
  nextStake(ctx: StrategyContext): number;
  /** Record the outcome of the last spin (net money result). */
  record(net: number, ctx: StrategyContext): void;
  /** Return to the starting state (used when a table limit breaks the progression). */
  reset(): void;
  /** Short description of the internal state for the UI. */
  state(locale?: "en" | "he"): string;
}

const r2 = (x: number) => Math.round(x * 100) / 100;

export function createStrategy(id: StrategyId, params: StrategyParams): Strategy {
  const base = params.baseBet;
  switch (id) {
    case "flat":
      return { id, nextStake: () => base, record: () => {}, reset: () => {}, state: (l) => (l === "he" ? "אותו הימור בכל סיבוב" : "Same stake every spin") };

    case "mixed": {
      // 5 units per spin: 3 on an outside bet, 1 on a six line, 1 straight-up.
      return { id, nextStake: () => base * 5, record: () => {}, reset: () => {}, state: (l) => (l === "he" ? "3 יח׳ בחוץ + 1 יח׳ שורה כפולה + 1 יח׳ מספר" : "3u outside + 1u six line + 1u straight") };
    }

    case "martingale": {
      let losses = 0;
      return {
        id,
        nextStake: () => base * 2 ** losses,
        record: (net) => { if (net > 0) losses = 0; else if (net < 0) losses++; },
        reset: () => { losses = 0; },
        state: (l) => (l === "he" ? `${losses} הפסדים ברצף ← הבא ${2 ** losses} יח׳` : `${losses} loss${losses === 1 ? "" : "es"} in a row → next ${2 ** losses}u`),
      };
    }

    case "paroli": {
      const steps = params.paroliSteps ?? 3;
      let wins = 0;
      return {
        id,
        nextStake: () => base * 2 ** wins,
        record: (net) => {
          if (net > 0) { wins++; if (wins >= steps) wins = 0; } else if (net < 0) wins = 0;
        },
        reset: () => { wins = 0; },
        state: (l) => (l === "he" ? `${wins}/${steps} זכיות ← הבא ${2 ** wins} יח׳` : `${wins}/${steps} wins → next ${2 ** wins}u`),
      };
    }

    case "dalembert": {
      let units = 1;
      return {
        id,
        nextStake: () => base * units,
        record: (net) => { if (net < 0) units++; else if (net > 0) units = Math.max(1, units - 1); },
        reset: () => { units = 1; },
        state: (l) => (l === "he" ? `הבא ${units} יח׳` : `next ${units}u`),
      };
    }

    case "fibonacci": {
      const fib = [1, 1];
      const at = (i: number) => { while (fib.length <= i) fib.push(fib[fib.length - 1] + fib[fib.length - 2]); return fib[i]; };
      let i = 0;
      return {
        id,
        nextStake: () => base * at(i),
        record: (net) => { if (net < 0) i++; else if (net > 0) i = Math.max(0, i - 2); },
        reset: () => { i = 0; },
        state: (l) => (l === "he" ? `שלב ${i + 1} ← הבא ${at(i)} יח׳` : `step ${i + 1} → next ${at(i)}u`),
      };
    }

    case "labouchere": {
      const start = params.labouchereLine?.length ? [...params.labouchereLine] : [1, 2, 3, 4];
      let line = [...start];
      const units = () => (line.length === 1 ? line[0] : line[0] + line[line.length - 1]);
      return {
        id,
        nextStake: () => { if (line.length === 0) line = [...start]; return base * units(); },
        record: (net, ctx) => {
          if (line.length === 0) line = [...start];
          const u = units();
          if (net > 0) {
            line = line.length <= 2 ? [] : line.slice(1, -1);
          } else if (net < 0) {
            // Add the lost amount (in units) needed to recover, given the bet's payout.
            line.push(Math.max(1, Math.round(u / Math.max(1, ctx.payout))));
          }
        },
        reset: () => { line = [...start]; },
        state: (l) => (line.length ? (l === "he" ? `שורה [${line.join(", ")}] ← הבא ${units()} יח׳` : `line [${line.join(", ")}] → next ${units()}u`) : l === "he" ? "השורה נמחקה — המחזור הושלם" : "line cleared — cycle won"),
      };
    }

    case "oscar": {
      let unitsBet = 1;
      let cycle = 0; // profit in the current cycle (money)
      return {
        id,
        nextStake: (ctx) => {
          const need = base - cycle; // amount still needed to finish the cycle +1 unit
          const toFinish = need / Math.max(1, ctx.payout);
          return r2(Math.max(ctx.minBet, Math.min(base * unitsBet, Math.ceil(toFinish / ctx.minBet) * ctx.minBet)));
        },
        record: (net) => {
          cycle = r2(cycle + net);
          if (cycle >= base - 1e-9) { cycle = 0; unitsBet = 1; }
          else if (net > 0) unitsBet++;
        },
        reset: () => { unitsBet = 1; cycle = 0; },
        state: (l) => (l === "he" ? `מחזור ${cycle >= 0 ? "+" : ""}${r2(cycle)} ← הבא ${unitsBet} יח׳` : `cycle ${cycle >= 0 ? "+" : ""}${r2(cycle)} → next ${unitsBet}u`),
      };
    }

    case "percentage": {
      const pct = params.percent ?? 0.02;
      return {
        id,
        nextStake: (ctx) => Math.max(ctx.minBet, Math.floor((ctx.bankroll * pct) / ctx.minBet) * ctx.minBet),
        record: () => {},
        reset: () => {},
        state: (l) => (l === "he" ? `${r2(pct * 100)}% מהקופה הנוכחית` : `${r2(pct * 100)}% of current bankroll`),
      };
    }
  }
}

/**
 * Generate the stake sequence for a scripted series of results (used for
 * step-by-step examples). `results` uses "W" / "L" for an even-money bet.
 */
export function scriptedProgression(
  id: StrategyId,
  params: StrategyParams,
  results: ("W" | "L")[],
  startBankroll = 100,
  locale: "en" | "he" = "en",
): { spin: number; stake: number; result: "W" | "L"; net: number; bankroll: number; state: string }[] {
  const s = createStrategy(id, params);
  let bankroll = startBankroll;
  return results.map((result, i) => {
    const ctx = { bankroll, minBet: Math.min(1, params.baseBet), payout: 1 };
    const state = s.state(locale);
    const stake = r2(s.nextStake(ctx));
    const net = result === "W" ? stake : -stake;
    bankroll = r2(bankroll + net);
    s.record(net, { ...ctx, bankroll });
    return { spin: i + 1, stake, result, net, bankroll, state };
  });
}
