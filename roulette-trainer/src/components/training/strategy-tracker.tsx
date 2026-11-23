"use client";
import { Bot, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { strategyNextStake } from "@/lib/coach/coach";
import { strategyInfo } from "@/lib/content/strategies.he";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import { useLocale, useT } from "@/lib/i18n";
import { betLabel } from "@/lib/i18n/bet-labels";
import * as B from "@/lib/roulette/bets";
import { createStrategy, type StrategyId } from "@/lib/roulette/strategies";
import { cn } from "@/lib/utils/cn";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

export interface TrackerState {
  required: number;
  state: string;
  followed: boolean | null;
  limitFail: boolean;
  bankrollFail: boolean;
  /** Bankroll needed to survive one more loss after this bet, then fund the next step. */
  nextStepNeed: number;
}

/** Strategy bookkeeping for the practice table. Pure apart from formatting. */
export function trackStrategy(id: StrategyId, baseBet: number, game: RouletteGame, cap: number): TrackerState {
  const spins = game.session?.spins ?? [];
  const { stake: required, state } = strategyNextStake({ id, baseBet }, spins, game.balance, game.rules.minBet);
  // What the system would ask for if this bet also loses.
  const s = createStrategy(id, { baseBet });
  for (const sp of spins) s.record(sp.net, { bankroll: sp.balanceAfter, minBet: game.rules.minBet, payout: 1 });
  s.record(-required, { bankroll: game.balance - required, minBet: game.rules.minBet, payout: 1 });
  const after = s.nextStake({ bankroll: game.balance - required, minBet: game.rules.minBet, payout: 1 });
  return {
    required,
    state,
    followed: game.stake > 0 ? Math.abs(game.stake - required) < 0.01 : null,
    limitFail: required > game.rules.maxOutside + 1e-9,
    bankrollFail: required > Math.min(game.balance, cap) + 1e-9,
    nextStepNeed: required + after,
  };
}

export function StrategyTracker({ id, baseBet, game, cap, auto, onAutoChange }: {
  id: StrategyId; baseBet: number; game: RouletteGame; cap: number; auto: boolean; onAutoChange: (v: boolean) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const tr = trackStrategy(id, baseBet, game, cap);
  const target = B.red();
  const exposure = game.balance > 0 ? tr.required / game.balance : 1;
  const blocked = tr.limitFail || tr.bankrollFail;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Target className="size-4 text-gold" aria-hidden />
        <span className="font-medium">{strategyInfo(id, locale).name}</span>
        <Badge variant="muted">{tr.state}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-surface-2/60 p-2"><dt className="text-[11px] text-muted">{t("tracker.required")}</dt><dd className="text-lg font-semibold tabular-nums text-gold-strong">{fmtMoney(tr.required)}</dd></div>
        <div className="rounded-lg bg-surface-2/60 p-2"><dt className="text-[11px] text-muted">{t("tracker.actual")}</dt>
          <dd className={cn("text-lg font-semibold tabular-nums", tr.followed === false && "text-warn", tr.followed && "text-good")}>{fmtMoney(game.stake)}</dd></div>
        <div className="rounded-lg bg-surface-2/60 p-2"><dt className="text-[11px] text-muted">{t("tracker.exposure")}</dt><dd className="tabular-nums">{fmtPct(exposure, 1)}</dd></div>
        <div className="rounded-lg bg-surface-2/60 p-2"><dt className="text-[11px] text-muted">{t("tracker.nextNeed")}</dt><dd className="tabular-nums">{fmtMoney(tr.nextStepNeed)}</dd></div>
      </dl>
      {tr.followed !== null && (
        <p className={cn("text-sm", tr.followed ? "text-good" : "text-warn")}>{tr.followed ? t("tracker.followed") : t("tracker.deviation")}</p>
      )}
      {tr.limitFail && <p className="rounded-lg bg-danger/10 p-2 text-sm text-danger">{t("tracker.limitFail", { req: fmtMoney(tr.required), max: fmtMoney(game.rules.maxOutside) })}</p>}
      {!tr.limitFail && tr.bankrollFail && <p className="rounded-lg bg-danger/10 p-2 text-sm text-danger">{t("tracker.bankrollFail", { req: fmtMoney(tr.required), avail: fmtMoney(Math.min(game.balance, cap)) })}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={blocked || game.phase === "spinning"} onClick={() => game.setTable([B.place(target, tr.required)])}>
          {t("tracker.place", { amount: fmtMoney(tr.required), bet: betLabel(target, locale) })}
        </Button>
        <Button size="sm" variant={auto ? "danger" : "secondary"} disabled={blocked && !auto} onClick={() => onAutoChange(!auto)}>
          <Bot /> {auto ? t("tracker.autoStop") : t("tracker.auto")}
        </Button>
      </div>
      <p className="text-[11px] text-muted">{t("tracker.note")}</p>
    </div>
  );
}
