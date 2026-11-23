import type { StrategyId } from "@/lib/roulette/strategies";
import type { WheelType } from "@/lib/roulette/wheel";

/** The personal training profile: the single editable source of truth for practice defaults. */
export interface TrainingProfile {
  bankroll: number;
  baseBet: number;
  wheel: WheelType;
  sessionMinMins: number;
  sessionMaxMins: number;
  profitTarget: number;
  stopLoss: number;
  strategy: StrategyId;
}

export const DEFAULT_PROFILE: TrainingProfile = {
  bankroll: 100,
  baseBet: 2,
  wheel: "european",
  sessionMinMins: 30,
  sessionMaxMins: 45,
  profitTarget: 10,
  stopLoss: 20,
  strategy: "flat",
};

export interface CasinoPlan {
  budget: number;
  stopLoss: number;
  stopWin: number;
  timeLimitMins: number;
  unit: number;
  bettingSeconds: number;
}

export interface ProfileIssue { field: keyof TrainingProfile; code: "positive" | "baseBetVsBankroll" | "stopLossVsBankroll" | "sessionRange" }

/** Validate a profile. Returns issue codes (translated by the UI). */
export function validateProfile(p: TrainingProfile): ProfileIssue[] {
  const out: ProfileIssue[] = [];
  for (const f of ["bankroll", "baseBet", "profitTarget", "stopLoss", "sessionMinMins", "sessionMaxMins"] as const) {
    if (!(p[f] > 0)) out.push({ field: f, code: "positive" });
  }
  if (p.baseBet > p.bankroll) out.push({ field: "baseBet", code: "baseBetVsBankroll" });
  if (p.stopLoss > p.bankroll) out.push({ field: "stopLoss", code: "stopLossVsBankroll" });
  if (p.sessionMinMins > p.sessionMaxMins) out.push({ field: "sessionMinMins", code: "sessionRange" });
  return out;
}

/** The settings fields a profile controls. Applying a profile keeps every mode consistent. */
export interface ProfileControlled {
  startingBankroll: number;
  practiceBaseBet: number;
  practiceStopLoss: number;
  practiceStopWin: number;
  practiceStrategy: StrategyId | null;
  wheel: WheelType;
  casinoPlan: CasinoPlan;
}

export function settingsFromProfile(p: TrainingProfile, prevPlan?: Partial<CasinoPlan>): ProfileControlled {
  return {
    startingBankroll: p.bankroll,
    practiceBaseBet: p.baseBet,
    practiceStopLoss: p.stopLoss,
    practiceStopWin: p.profitTarget,
    practiceStrategy: p.strategy,
    wheel: p.wheel,
    casinoPlan: {
      budget: p.bankroll,
      unit: p.baseBet,
      stopLoss: p.stopLoss,
      stopWin: p.profitTarget,
      timeLimitMins: p.sessionMaxMins,
      bettingSeconds: prevPlan?.bettingSeconds ?? 20,
    },
  };
}
