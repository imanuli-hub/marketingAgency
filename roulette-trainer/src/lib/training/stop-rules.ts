/**
 * Session stopping rules shared by practice sessions and casino rehearsals.
 * Stop rules limit how much of the budget a session exposes; they do NOT
 * change the house edge on any bet.
 */
export type StopReason = "stopLoss" | "stopWin" | "timeLimit" | "bankrupt";

export interface StopPlan {
  /** Loss (positive money) at which the session ends. 0 = no limit. */
  stopLoss: number;
  /** Profit at which the session ends. 0 = no target. */
  stopWin: number;
  /** Maximum session length. 0/undefined = none. */
  timeLimitMins?: number;
  minBet: number;
}

const EPS = 1e-9;

export function checkStopRules(startBalance: number, balance: number, startedAt: number, now: number, plan: StopPlan): StopReason | null {
  const net = balance - startBalance;
  if (plan.stopLoss > 0 && net <= -plan.stopLoss + EPS) return "stopLoss";
  if (plan.stopWin > 0 && net >= plan.stopWin - EPS) return "stopWin";
  if (balance < plan.minBet - EPS) return "bankrupt";
  if (plan.timeLimitMins && now - startedAt >= plan.timeLimitMins * 60_000) return "timeLimit";
  return null;
}

/** Largest total stake allowed so that losing it cannot take the session past the stop-loss. */
export function stakeAllowance(startBalance: number, balance: number, plan: Pick<StopPlan, "stopLoss">): number {
  const byBalance = Math.max(0, balance);
  if (!(plan.stopLoss > 0)) return byBalance;
  return Math.max(0, Math.min(byBalance, Math.round((plan.stopLoss + (balance - startBalance)) * 100) / 100));
}
