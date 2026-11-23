"use client";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/ui/form";
import { buildSessionReview } from "@/lib/analytics/review";
import { useT, type MessageKey } from "@/lib/i18n";
import type { SessionRecord } from "@/store/app-store";
import { fmtDuration, fmtMoney, fmtPct } from "@/lib/utils/format";

export function endReasonText(t: ReturnType<typeof useT>, reason?: string) {
  if (!reason) return "";
  const known = ["stopLoss", "stopWin", "timeLimit", "bankrupt", "manual", "break", "reset"];
  return known.includes(reason) ? t(`end.${reason}` as MessageKey) : reason;
}

/** Educational post-session report. Discipline is scored; profit is explained as variance. */
export function SessionReport({ rec, onClose }: { rec: SessionRecord; onClose?: () => void }) {
  const t = useT();
  const r = buildSessionReview(rec);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label={t("review.start")} value={fmtMoney(r.startBalance)} />
        <Stat label={t("review.end")} value={fmtMoney(r.endBalance)} />
        <Stat label={t("review.net")} value={fmtMoney(r.net, { sign: true })} tone={r.net > 0 ? "good" : r.net < 0 ? "danger" : undefined} />
        <Stat label={t("review.wagered")} value={fmtMoney(r.wagered)} sub={t("review.spinsSub", { spins: r.spins, time: fmtDuration(r.durationMs) })} />
        <Stat label={t("review.bets")} value={`${r.winningBets} / ${r.losingBets}`} sub={t("review.betsSub")} />
        <Stat label={t("review.avgStake")} value={fmtMoney(r.avgStake, { decimals: 2 })} />
        <Stat label={t("review.drawdown")} value={fmtMoney(r.maxDrawdown)} />
        <Stat label={t("review.expected")} value={fmtMoney(-r.theoreticalLoss, { decimals: 2 })} sub={t("review.expectedSub")} />
        <Stat label={t("review.variance")} value={fmtMoney(r.variance, { sign: true, decimals: 2 })} sub={t("review.varianceSub")} />
      </div>

      <div className="flex gap-2 rounded-xl border border-info/30 bg-info/5 p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <p>{r.net > 0 ? t("review.luckWin") : t("review.luckLoss")}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-2/50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted">{t("review.discipline")}</div>
          <div className={`mt-1 text-2xl font-semibold ${r.discipline >= 80 ? "text-good" : r.discipline >= 50 ? "text-warn" : "text-danger"}`}>{r.discipline}/100</div>
          <p className="mt-1 text-xs text-muted">{t("review.disciplineNote")}</p>
        </div>
        <div className="space-y-1.5 rounded-xl border border-border bg-surface-2/50 p-3 text-sm">
          <div className="text-[11px] uppercase tracking-wide text-muted">{t("review.adherence")}</div>
          <p>{r.strategy.rate === null ? t("review.noStrategy") : t("review.strategyRate", { followed: r.strategy.followed, checked: r.strategy.checked, rate: fmtPct(r.strategy.rate, 0) })}</p>
          <p>{!r.stopRules.hasPlan ? t("review.noPlan") : r.stopRules.lossExceeded || r.stopRules.playedPastLimit || r.stopRules.playedPastTarget ? t("review.stopBroken") : r.stopRules.endedOnRule ? t("review.stopKept") : t("review.stopNotReached")}</p>
          <p className="text-xs text-muted">{t("review.endedBy", { reason: endReasonText(t, rec.endReason) || "—" })}</p>
        </div>
      </div>

      {r.warnings.length > 0 ? (
        <ul className="space-y-1.5">
          {r.warnings.map((w) => (
            <li key={w} className="flex gap-2 rounded-lg bg-warn/5 p-2 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />{t(`review.warn.${w}` as MessageKey, { chase: r.chaseCount, oversized: r.oversizedCount })}</li>
          ))}
        </ul>
      ) : (
        <p className="flex gap-2 rounded-lg bg-good/10 p-2 text-sm text-good"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />{t("review.noWarnings")}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/30 bg-gold/5 p-3">
        <p className="text-sm">{t(`review.rec.${r.recommendation.code}` as MessageKey)}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild><Link href={r.recommendation.href}>{t("review.recCta")} <ArrowRight className="rtl:-scale-x-100" /></Link></Button>
          {onClose && <Button size="sm" variant="ghost" onClick={onClose}>{t("common.close")}</Button>}
        </div>
      </div>
    </div>
  );
}
