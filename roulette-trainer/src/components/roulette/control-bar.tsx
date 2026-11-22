"use client";
import { Eraser, RotateCcw, Undo2, X2 } from "@/components/roulette/icons";
import { Button } from "@/components/ui/button";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import { fmtMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CHIP_DENOMS, ChipButton } from "./chip";

export function ControlBar({ game, spinLabel = "Spin", hideSpin, className }: { game: RouletteGame; spinLabel?: string; hideSpin?: boolean; className?: string }) {
  const spinning = game.phase === "spinning";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-end gap-1.5 overflow-x-auto px-1 pt-2 pb-1 [scrollbar-width:none]" role="radiogroup" aria-label="Chip value">
          {CHIP_DENOMS.map((v) => (
            <ChipButton key={v} value={v} size={42} selected={game.chip === v} disabled={v > game.rules.maxOutside} onClick={() => game.setChip(v)} />
          ))}
        </div>
        <div className="hidden text-right sm:block">
          <div className="text-[11px] uppercase tracking-wide text-muted">On table</div>
          <div className="font-semibold tabular-nums text-gold-strong">{fmtMoney(game.stake)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="sm" onClick={game.undo} disabled={!game.canUndo} aria-label="Undo last bet"><Undo2 /> <span className="hidden sm:inline">Undo</span></Button>
        <Button variant="secondary" size="sm" onClick={game.clear} disabled={spinning || !game.activeBets.length} aria-label="Clear bets"><Eraser /> <span className="hidden sm:inline">Clear</span></Button>
        <Button variant="secondary" size="sm" onClick={game.repeat} disabled={spinning || !game.lastBets.length} aria-label="Repeat previous bets"><RotateCcw /> <span className="hidden sm:inline">Repeat</span></Button>
        <Button variant="secondary" size="sm" onClick={game.double} disabled={spinning || !game.activeBets.length} aria-label="Double bets"><X2 /> <span className="hidden sm:inline">Double</span></Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-gold-strong sm:hidden">{fmtMoney(game.stake)}</span>
          {!hideSpin && (
            <Button size="lg" className="min-w-24" onClick={() => game.spin()} disabled={spinning || (!game.activeBets.length && !game.prison.length)}>
              {spinning ? "Spinning…" : spinLabel}
            </Button>
          )}
        </div>
      </div>
      {game.notice && <p className="text-center text-xs text-warn" role="alert">{game.notice}</p>}
    </div>
  );
}
