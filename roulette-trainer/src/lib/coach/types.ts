import type { BetKind, PlacedBet } from "@/lib/roulette/bets";
import type { TableRules } from "@/lib/roulette/engine";
import type { StrategyId } from "@/lib/roulette/strategies";

export type CoachMode = "beginner" | "intermediate" | "advanced";
export type InsightTone = "info" | "good" | "warn" | "danger";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
}

export interface SpinRecord {
  pocket: number;
  staked: number;
  returned: number;
  net: number;
  balanceAfter: number;
  at: number;
  bets: { key: string; kind: BetKind; amount: number }[];
}

export interface CoachSession {
  startBalance: number;
  startedAt: number;
  spins: SpinRecord[];
  stopLoss?: number;
  stopWin?: number;
}

export interface CoachInput {
  mode: CoachMode;
  rules: TableRules;
  bets: PlacedBet[];
  balance: number;
  session: CoachSession | null;
  strategy?: { id: StrategyId; baseBet: number } | null;
  now: number;
  breakReminderMins?: number;
}

/**
 * A coach provider turns the game state into insights. The built-in provider
 * is deterministic; an LLM provider can wrap it (see ./llm.ts).
 */
export interface CoachProvider {
  analyze(input: CoachInput): Promise<Insight[]> | Insight[];
}
