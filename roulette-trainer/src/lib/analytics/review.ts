import type { SessionRecord } from "@/store/app-store";

export type ReviewWarning =
  | "chasing"
  | "oversized"
  | "lossLimitExceeded"
  | "playedPastTarget"
  | "playedPastLimit"
  | "overtime"
  | "strategyDeviation"
  | "highExposure"
  | "fewSpins";

export type Recommendation = { code: "chasing" | "stopRules" | "strategy" | "time" | "exposure" | "guided" | "continue"; href: string };

export interface SessionReview {
  startBalance: number;
  endBalance: number;
  net: number;
  wagered: number;
  spins: number;
  winningBets: number;
  losingBets: number;
  winningSpins: number;
  losingSpins: number;
  avgStake: number;
  maxDrawdown: number;
  theoreticalLoss: number;
  /** Actual − expected: the part of the result explained by variance (luck). */
  variance: number;
  durationMs: number;
  strategy: { checked: number; followed: number; rate: number | null };
  stopRules: { hasPlan: boolean; endedOnRule: boolean; lossExceeded: boolean; playedPastTarget: boolean; playedPastLimit: boolean; overtime: boolean };
  chaseCount: number;
  oversizedCount: number;
  warnings: ReviewWarning[];
  /** 0..100. Measures plan discipline only; profit and stake size never raise it. */
  discipline: number;
  recommendation: Recommendation;
}

const EPS = 1e-9;
export const STOP_REASONS = ["stopLoss", "stopWin", "timeLimit", "bankrupt"];

export function buildSessionReview(rec: SessionRecord): SessionReview {
  const spins = rec.spins;
  const plan = rec.plan;
  const net = Math.round((rec.balance - rec.startBalance) * 100) / 100;
  let winningBets = 0, losingBets = 0, chase = 0, oversized = 0, highExposure = 0;
  let checked = 0, followed = 0;
  let playedPastTarget = false, playedPastLimit = false;
  let prevBalance = rec.startBalance;
  spins.forEach((sp, i) => {
    for (const b of sp.bets) {
      const won = b.won ?? sp.net > 0;
      if (won) winningBets++; else losingBets++;
    }
    if (i > 0 && spins[i - 1].net < 0 && sp.staked > spins[i - 1].staked * 1.4 + EPS) chase++;
    if (plan && sp.staked > plan.unit * 4 + EPS) oversized++;
    if (prevBalance > 0 && sp.staked / prevBalance > 0.1 + EPS) highExposure++;
    if (sp.strategyRequired !== undefined) {
      checked++;
      if (Math.abs(sp.staked - sp.strategyRequired) < 0.01) followed++;
    }
    if (plan) {
      const before = prevBalance - rec.startBalance;
      if (plan.stopWin > 0 && before >= plan.stopWin - EPS) playedPastTarget = true;
      if (plan.stopLoss > 0 && before <= -plan.stopLoss + EPS) playedPastLimit = true;
    }
    prevBalance = sp.balanceAfter;
  });
  const durationMs = (rec.endedAt ?? spins.at(-1)?.at ?? rec.startedAt) - rec.startedAt;
  const lossExceeded = !!plan && plan.stopLoss > 0 && net < -plan.stopLoss - EPS;
  const overtime = !!plan && plan.timeLimitMins > 0 && durationMs > (plan.timeLimitMins + 1) * 60_000;
  const rate = checked ? followed / checked : null;

  const warnings: ReviewWarning[] = [];
  if (chase) warnings.push("chasing");
  if (oversized) warnings.push("oversized");
  if (lossExceeded) warnings.push("lossLimitExceeded");
  if (playedPastTarget) warnings.push("playedPastTarget");
  if (playedPastLimit) warnings.push("playedPastLimit");
  if (overtime) warnings.push("overtime");
  if (rate !== null && rate < 1) warnings.push("strategyDeviation");
  if (highExposure) warnings.push("highExposure");
  if (spins.length < 10) warnings.push("fewSpins");

  let discipline = 100 - chase * 10 - oversized * 5 - highExposure * 3 - (lossExceeded ? 30 : 0) - (playedPastTarget ? 15 : 0) - (playedPastLimit ? 25 : 0) - (overtime ? 10 : 0) - (rate === null ? 0 : Math.round((1 - rate) * 30));
  discipline = Math.max(0, Math.min(100, discipline));

  const recommendation: Recommendation =
    chase ? { code: "chasing", href: "/program/6" }
    : lossExceeded || playedPastLimit || playedPastTarget ? { code: "stopRules", href: "/program/4" }
    : rate !== null && rate < 1 ? { code: "strategy", href: "/strategies" }
    : overtime ? { code: "time", href: "/program/12" }
    : oversized || highExposure ? { code: "exposure", href: "/program/5" }
    : spins.length < 10 ? { code: "guided", href: "/guided" }
    : { code: "continue", href: "/program" };

  return {
    startBalance: rec.startBalance,
    endBalance: rec.balance,
    net,
    wagered: rec.wagered,
    spins: rec.spinCount,
    winningBets,
    losingBets,
    winningSpins: rec.winningSpins,
    losingSpins: rec.losingSpins,
    avgStake: rec.spinCount ? rec.wagered / rec.spinCount : 0,
    maxDrawdown: rec.maxDrawdown,
    theoreticalLoss: rec.theoreticalLoss,
    variance: Math.round((net + rec.theoreticalLoss) * 100) / 100,
    durationMs,
    strategy: { checked, followed, rate },
    stopRules: { hasPlan: !!plan, endedOnRule: STOP_REASONS.includes(rec.endReason ?? ""), lossExceeded, playedPastTarget, playedPastLimit, overtime },
    chaseCount: chase,
    oversizedCount: oversized,
    warnings,
    discipline,
    recommendation,
  };
}
