"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { SpinSettlement } from "@/lib/roulette/engine";
import { pocketColor, pocketLabel, isZero } from "@/lib/roulette/wheel";
import { useT, type MessageKey } from "@/lib/i18n";
import { fmtMoney } from "@/lib/utils/format";
import { PocketBadge } from "./pocket-badge";

export function ResultBanner({ settlement, reduced, spinId, explain }: { settlement: SpinSettlement | null; reduced: boolean; spinId: number; explain?: boolean }) {
  const t = useT();
  return (
    <AnimatePresence mode="wait">
      {settlement && (
        <motion.div
          key={spinId}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.35 }}
          className="rounded-2xl border border-gold/30 bg-black/50 p-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <PocketBadge pocket={settlement.pocket} size="lg" />
            <div className="min-w-0">
              <div className="text-sm text-muted">
                {pocketLabel(settlement.pocket)} {t(`color.${pocketColor(settlement.pocket)}` as MessageKey)}
                {!isZero(settlement.pocket) && ` · ${t(settlement.pocket % 2 ? "result.odd" : "result.even")} · ${settlement.pocket <= 18 ? "1–18" : "19–36"}`}
              </div>
              {settlement.staked === 0 && settlement.outcomes.length === 0 ? (
                <div className="text-lg font-semibold">{t("result.noBets")}</div>
              ) : settlement.net > 0 ? (
                <div className="text-xl font-semibold text-good">{t("result.win", { amount: fmtMoney(settlement.net, { sign: true }) })}</div>
              ) : settlement.net === 0 ? (
                <div className="text-xl font-semibold">{t("result.push")}</div>
              ) : (
                <div className="text-xl font-semibold text-danger">{t("result.loss", { amount: fmtMoney(settlement.net) })}</div>
              )}
              <div className="text-xs text-muted">
                {t("result.paid", { returned: fmtMoney(settlement.returned), staked: fmtMoney(settlement.staked) })}
                {settlement.imprisoned.length > 0 && ` · ${t("result.prison")}`}
                {settlement.outcomes.some((o) => o.status === "halfBack") && ` · ${t("result.partage")}`}
              </div>
            </div>
          </div>
          {explain && settlement.outcomes.length > 0 && (
            <ul className="mt-2 space-y-0.5 border-t border-border pt-2 text-xs text-foreground/80">
              {settlement.outcomes.map((o, i) => (
                <li key={i}>
                  {o.status === "win"
                    ? t("result.explainWin", { stake: fmtMoney(o.bet.amount), payout: o.bet.payout, win: fmtMoney(o.net), back: fmtMoney(o.returned) })
                    : o.status === "halfBack"
                      ? t("result.explainHalf", { stake: fmtMoney(o.bet.amount), back: fmtMoney(o.returned) })
                      : t("result.explainLose", { stake: fmtMoney(o.bet.amount) })}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
