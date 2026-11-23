"use client";
import { X } from "lucide-react";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import { useLocale, useT } from "@/lib/i18n";
import { betLabel } from "@/lib/i18n/bet-labels";
import { betMath } from "@/lib/roulette/probability";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

export function BetSlip({ game }: { game: RouletteGame }) {
  const t = useT();
  const locale = useLocale();
  const bets = game.activeBets;
  return (
    <div className="space-y-2">
      {bets.length === 0 && <p className="text-sm text-muted">{t("slip.empty")}</p>}
      <ul className="divide-y divide-border/60">
        {bets.map((b) => {
          const m = betMath(b, game.rules);
          const label = betLabel(b, locale);
          return (
            <li key={b.key} className="flex items-center gap-2 py-1.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate">{label}</div>
                <div className="text-xs text-muted">{t("slip.line", { payout: b.payout, p: fmtPct(m.pWin), win: fmtMoney(b.amount * b.payout) })}</div>
              </div>
              <span className="tabular-nums font-medium">{fmtMoney(b.amount)}</span>
              <button className="grid size-9 place-items-center rounded-lg text-muted hover:text-danger" onClick={() => game.removeBet(b.key)} disabled={game.phase === "spinning"} aria-label={t("slip.remove", { label })}>
                <X className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      {game.prison.length > 0 && (
        <p className="rounded-lg bg-info/10 p-2 text-xs text-info">
          {t("slip.prison", { bets: game.prison.map((b) => `${betLabel(b, locale)} ${fmtMoney(b.amount)}`).join(", ") })}
        </p>
      )}
    </div>
  );
}
