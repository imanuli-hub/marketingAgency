"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { SpinSettlement } from "@/lib/roulette/engine";
import { pocketColor, pocketLabel, isZero } from "@/lib/roulette/wheel";
import { fmtMoney } from "@/lib/utils/format";
import { PocketBadge } from "./pocket-badge";

export function ResultBanner({ settlement, reduced, spinId }: { settlement: SpinSettlement | null; reduced: boolean; spinId: number }) {
  return (
    <AnimatePresence mode="wait">
      {settlement && (
        <motion.div
          key={spinId}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.35 }}
          className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-black/50 p-3"
          role="status"
          aria-live="polite"
        >
          <PocketBadge pocket={settlement.pocket} size="lg" />
          <div className="min-w-0">
            <div className="text-sm text-muted">
              {pocketLabel(settlement.pocket)} {pocketColor(settlement.pocket)}
              {!isZero(settlement.pocket) && ` · ${settlement.pocket % 2 ? "odd" : "even"} · ${settlement.pocket <= 18 ? "1–18" : "19–36"}`}
            </div>
            {settlement.staked === 0 && settlement.outcomes.length === 0 ? (
              <div className="text-lg font-semibold">No bets this spin</div>
            ) : settlement.net > 0 ? (
              <div className="text-xl font-semibold text-good">Win {fmtMoney(settlement.net, { sign: true })}</div>
            ) : settlement.net === 0 ? (
              <div className="text-xl font-semibold text-foreground">Push · {fmtMoney(0)}</div>
            ) : (
              <div className="text-xl font-semibold text-danger">{fmtMoney(settlement.net)}</div>
            )}
            <div className="text-xs text-muted">
              Paid back {fmtMoney(settlement.returned)} on {fmtMoney(settlement.staked)} staked
              {settlement.imprisoned.length > 0 && " · even-money bets held en prison"}
              {settlement.outcomes.some((o) => o.status === "halfBack") && " · La Partage returned half"}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
