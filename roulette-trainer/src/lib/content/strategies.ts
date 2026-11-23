import type { StrategyId } from "@/lib/roulette/strategies";

export interface StrategyInfo {
  id: StrategyId;
  name: string;
  family: "flat" | "negative progression" | "positive progression" | "cycle" | "proportional" | "coverage";
  tagline: string;
  how: string[];
  /** Scripted W/L sequence used for the worked example. */
  example: ("W" | "L")[];
  strengths: string[];
  weaknesses: string[];
  /** What it actually changes. */
  effect: string;
  bankrollNote: string;
  risk: "low" | "medium" | "high" | "very high";
}

const EV_NOTE = "Expected value is unchanged: every unit wagered still loses 2.70% on average (European).";

export const STRATEGY_INFO: Record<StrategyId, StrategyInfo> = {
  flat: {
    id: "flat",
    name: "Flat Betting",
    family: "flat",
    tagline: "Same stake every spin. The baseline every other system is measured against.",
    how: [
      "Choose one unit size before you sit down (e.g. 1–2% of your session budget).",
      "Bet exactly that unit on every spin, win or lose.",
      "Stop when you reach your loss limit, win goal or time limit.",
    ],
    example: ["L", "W", "L", "L", "W", "W", "L", "W"],
    strengths: ["Lowest total amount wagered for a given number of spins, so the lowest expected loss", "Easy to follow — no in-session decisions to get wrong", "Results are predictable: variance grows slowly and evenly"],
    weaknesses: ["Can't 'recover' losses quickly (nothing can, reliably)", "Feels slow when losing — the temptation is to start chasing"],
    effect: `Baseline. ${EV_NOTE}`,
    bankrollNote: "A 100-unit bankroll lasts several hundred even-money spins on average.",
    risk: "low",
  },
  martingale: {
    id: "martingale",
    name: "Martingale",
    family: "negative progression",
    tagline: "Double after every loss so one win recovers everything plus one unit.",
    how: [
      "Start with 1 unit on an even-money bet (Red, Black, Odd, Even, 1–18, 19–36).",
      "After a loss, double the stake. After a win, return to 1 unit.",
      "Each completed cycle wins exactly 1 unit — until a losing streak hits your bankroll or the table maximum.",
    ],
    example: ["L", "L", "L", "W", "L", "W", "W"],
    strengths: ["Very high probability of a small session profit", "Simple rules"],
    weaknesses: [
      "Stakes grow exponentially: 10 losses in a row needs a 512-unit bet and 1,023 units total",
      "Table maximums cap the progression (e.g. €2 base, €200 max = only 6 doublings)",
      "Rare but catastrophic losses wipe out many small wins",
      "Bets far more money in total, so the expected loss is larger than flat betting over the same spins",
    ],
    effect: `Reshapes outcomes into many small wins and rare huge losses. ${EV_NOTE}`,
    bankrollNote: "To survive k straight losses you need (2^k − 1) units. 8 losses in a row happens about once every ~200 cycles on a single-zero wheel.",
    risk: "very high",
  },
  paroli: {
    id: "paroli",
    name: "Reverse Martingale (Paroli)",
    family: "positive progression",
    tagline: "Double after wins, bank the profit after three in a row.",
    how: [
      "Bet 1 unit on an even-money bet.",
      "After a win, let it ride (double). After 3 consecutive wins, bank the profit and restart at 1 unit.",
      "After any loss, go back to 1 unit.",
    ],
    example: ["W", "W", "W", "L", "W", "L", "W", "W"],
    strengths: ["Losses are capped at one base unit per cycle", "Occasional larger wins from short streaks", "Bankroll declines slowly"],
    weaknesses: ["Most cycles lose 1 unit; the 3-win streak needed occurs only ~11% of the time", "Gives back most streak profits on the 3rd bet"],
    effect: `Shifts risk toward rare bigger wins and frequent small losses. ${EV_NOTE}`,
    bankrollNote: "Needs only ~1 unit of risk per cycle; a 50-unit bankroll is comfortable.",
    risk: "low",
  },
  dalembert: {
    id: "dalembert",
    name: "D'Alembert",
    family: "negative progression",
    tagline: "A gentler progression: +1 unit after a loss, −1 unit after a win.",
    how: [
      "Start at 1 unit on an even-money bet.",
      "After a loss, increase the stake by 1 unit. After a win, decrease by 1 unit (never below 1).",
      "Based on the false idea that wins and losses 'balance out' — they don't (the gambler's fallacy).",
    ],
    example: ["L", "L", "W", "L", "W", "W", "L", "W"],
    strengths: ["Stakes grow linearly, not exponentially", "Fewer table-limit problems than Martingale"],
    weaknesses: ["Long negative runs still push stakes and losses up", "Total wagered is higher than flat betting, raising expected loss", "Equal numbers of wins and losses don't guarantee a profit in practice because zero breaks the balance"],
    effect: `Moderately increases the chance of a small profit, with a fatter loss tail. ${EV_NOTE}`,
    bankrollNote: "A run of 10 net losses needs about 55 units in total.",
    risk: "medium",
  },
  fibonacci: {
    id: "fibonacci",
    name: "Fibonacci",
    family: "negative progression",
    tagline: "Move one step up the Fibonacci sequence after a loss, two steps back after a win.",
    how: [
      "Stake sequence in units: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55…",
      "After a loss, move one step forward. After a win, move two steps back.",
      "A cycle ends when you return to the start of the sequence.",
    ],
    example: ["L", "L", "L", "L", "W", "W", "L", "W"],
    strengths: ["Grows more slowly than Martingale at first", "A win recovers the last two losses"],
    weaknesses: ["Still exponential growth (~1.6× per step)", "Long losing streaks leave a large deficit that needs several wins to clear", "Table limits still break the progression"],
    effect: `A slower Martingale: more small wins, occasional large losses. ${EV_NOTE}`,
    bankrollNote: "10 losses in a row cost 143 units with a next bet of 89.",
    risk: "high",
  },
  labouchere: {
    id: "labouchere",
    name: "Labouchère (Cancellation)",
    family: "negative progression",
    tagline: "Write a line of numbers; bet the first + last; cross off on wins, add on losses.",
    how: [
      "Write a line such as 1-2-3-4 (the sum, 10 units, is your cycle target).",
      "Bet the first + last numbers. Win: cross both off. Lose: add the amount lost to the end.",
      "When every number is crossed off, you've won the target. Start a new line.",
    ],
    example: ["L", "W", "W", "L", "L", "W", "W", "W"],
    strengths: ["Clear session target", "Each win removes two numbers while a loss adds one, so you can win with fewer wins than losses"],
    weaknesses: ["The line can grow long and stakes can escalate sharply", "A bad cycle can cost far more than the target it tried to win", "Complex to track at a real table"],
    effect: `Raises the probability of reaching a modest target while adding a heavy tail. ${EV_NOTE}`,
    bankrollNote: "Plan for a bankroll at least 10–20× the line total, and still expect occasional busted cycles.",
    risk: "high",
  },
  oscar: {
    id: "oscar",
    name: "Oscar's Grind",
    family: "cycle",
    tagline: "Aim to win exactly one unit per cycle; raise the stake only after wins.",
    how: [
      "Each cycle aims for +1 unit profit. Start with a 1-unit bet.",
      "After a loss, keep the same stake. After a win, increase by 1 unit — but never bet more than needed to finish the cycle at +1.",
      "When the cycle reaches +1 unit, start again at 1 unit.",
    ],
    example: ["L", "L", "W", "L", "W", "W", "W"],
    strengths: ["Stakes rise after wins, not losses, so escalation is slow", "High proportion of cycles complete with +1 unit"],
    weaknesses: ["Long cycles can still accumulate a large deficit", "Small wins, slow progress; tempting to break the rules"],
    effect: `Many small cycle wins, occasional long losing cycles. ${EV_NOTE}`,
    bankrollNote: "Typically 30–50 units handles most cycles, but not all.",
    risk: "medium",
  },
  percentage: {
    id: "percentage",
    name: "Fixed-Percentage Betting",
    family: "proportional",
    tagline: "Bet a fixed percentage of your current bankroll each spin.",
    how: [
      "Choose a percentage (e.g. 2%).",
      "Each spin, stake that percentage of your current bankroll, rounded to chip sizes and at least the table minimum.",
      "Stakes shrink automatically while losing and grow while winning.",
    ],
    example: ["L", "L", "W", "L", "W", "W", "L", "L"],
    strengths: ["Mathematically hard to go broke quickly — losses slow you down", "A sound bankroll-management habit"],
    weaknesses: ["Still loses to the house edge over time", "Table minimums eventually force a larger percentage as the bankroll shrinks"],
    effect: `Controls the pace of losses and the risk of ruin. ${EV_NOTE}`,
    bankrollNote: "At 2% per spin you can absorb long losing runs without busting.",
    risk: "low",
  },
  mixed: {
    id: "mixed",
    name: "Mixed Inside/Outside",
    family: "coverage",
    tagline: "Combine an outside bet with inside bets to cover more of the wheel.",
    how: [
      "Example used here: 3 units on Black, 1 unit on the six line 1–6, 1 unit straight up on 0.",
      "Covers 18 + 6 (3 red) + 1 = 22 of 37 pockets; any covered pocket returns something.",
      "Hedging changes how often you win, never the house edge of each bet.",
    ],
    example: ["W", "L", "W", "W", "L", "W", "L", "W"],
    strengths: ["Frequent hits make sessions feel smoother", "Illustrates how layouts combine"],
    weaknesses: ["Some 'wins' are net losses (e.g. a black number in 1–6 wins Black but loses the others)", "Higher stake per spin means a higher expected loss per spin"],
    effect: `Coverage reshapes the outcome distribution, nothing more. ${EV_NOTE}`,
    bankrollNote: "Uses 5 units per spin, so budget for 5× the per-spin expected loss of a 1-unit bet.",
    risk: "medium",
  },
};

export const WHAT_CHANGES_EV = [
  { title: "Wheel choice", body: "A single-zero (European) wheel has a 2.70% edge; a double-zero (American) wheel has 5.26%. This is the biggest decision you control." },
  { title: "Table rules", body: "La Partage or En Prison cut the edge on even-money bets to about 1.35–1.39%. Look for them on single-zero tables (common in Europe, rare in the US)." },
  { title: "Avoiding the basket", body: "On American tables the 0-00-1-2-3 'top line' carries a 7.89% edge — the worst bet on the layout." },
  { title: "How much you wager in total", body: "Expected loss = total wagered × house edge. Smaller stakes, fewer spins, and a slower pace reduce what you expect to lose. No sequencing of bets changes the percentage." },
];
