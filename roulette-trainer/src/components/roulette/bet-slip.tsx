"use client";
import { X } from "lucide-react";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import { betMath } from "@/lib/roulette/probability";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

export function BetSlip({ game }: { game: RouletteGame }) {
  const bets = game.activeBets;
  return (
    <div className="space-y-2">
      {bets.length === 0 && <p className="text-sm text-muted">No bets placed.</p>}
      <ul className="divide-y divide-border/60">
        {bets.map((b) => {
          const m = betMath(b, game.rules);
          return (
            <li key={b.key} className="flex items-center gap-2 py-1.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate">{b.label}</div>
                <div className="text-xs text-muted">{b.payout}:1 · wins {fmtPct(m.pWin)} · pays {fmtMoney(b.amount * b.payout)}</div>
              </div>
              <span className="tabular-nums font-medium">{fmtMoney(b.amount)}</span>
              <button className="rounded p-1 text-muted hover:text-danger" onClick={() => game.removeBet(b.key)} disabled={game.phase === "spinning"} aria-label={`Remove ${b.label}`}>
                <X className="size-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
      {game.prison.length > 0 && (
        <p className="rounded-lg bg-info/10 p-2 text-xs text-info">
          En prison: {game.prison.map((b) => `${b.label} ${fmtMoney(b.amount)}`).join(", ")} — returned if it wins next spin.
        </p>
      )}
    </div>
  );
}
