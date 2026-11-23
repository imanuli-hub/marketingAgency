"use client";
import { Eraser, RotateCcw, Undo2, X2 } from "@/components/roulette/icons";
import { Button } from "@/components/ui/button";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import { useT } from "@/lib/i18n";
import { fmtMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CHIP_DENOMS, ChipButton } from "./chip";

export function ControlBar({ game, spinLabel, hideSpin, className, lockChips, onSpin }: { game: RouletteGame; spinLabel?: string; hideSpin?: boolean; className?: string; lockChips?: boolean; onSpin?: () => void }) {
  const t = useT();
  const spinning = game.phase === "spinning";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div dir="ltr" className="flex items-end gap-1.5 overflow-x-auto px-1 pb-1 pt-2 [scrollbar-width:none]" role="radiogroup" aria-label={t("a11y.chipValue")}>
          {CHIP_DENOMS.map((v) => (
            <ChipButton key={v} value={v} size={44} selected={game.chip === v} disabled={lockChips || v > game.rules.maxOutside} onClick={() => game.setChip(v)} label={t("a11y.chip", { value: fmtMoney(v) })} />
          ))}
        </div>
        <div className="hidden text-end sm:block">
          <div className="text-[11px] uppercase tracking-wide text-muted">{t("controls.onTable")}</div>
          <div className="font-semibold tabular-nums text-gold-strong">{fmtMoney(game.stake)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" className="h-11 px-3" onClick={game.undo} disabled={!game.canUndo} aria-label={t("controls.undo")}><Undo2 className="rtl:-scale-x-100" /> <span className="hidden sm:inline">{t("controls.undo")}</span></Button>
        <Button variant="secondary" className="h-11 px-3" onClick={game.clear} disabled={spinning || !game.activeBets.length} aria-label={t("controls.clear")}><Eraser /> <span className="hidden sm:inline">{t("controls.clear")}</span></Button>
        <Button variant="secondary" className="h-11 px-3" onClick={game.repeat} disabled={spinning || !game.lastBets.length} aria-label={t("controls.repeat")}><RotateCcw /> <span className="hidden sm:inline">{t("controls.repeat")}</span></Button>
        <Button variant="secondary" className="h-11 px-3" onClick={game.double} disabled={spinning || !game.activeBets.length} aria-label={t("controls.double")}><X2 /> <span className="hidden sm:inline">{t("controls.double")}</span></Button>
        <div className="ms-auto flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-gold-strong sm:hidden">{fmtMoney(game.stake)}</span>
          {!hideSpin && (
            <Button size="lg" className="min-w-24" onClick={() => (onSpin ? onSpin() : game.spin())} disabled={spinning || (!game.activeBets.length && !game.prison.length)}>
              {spinning ? t("controls.spinning") : spinLabel ?? t("controls.spin")}
            </Button>
          )}
        </div>
      </div>
      {game.notice && <p className="text-center text-xs text-warn" role="alert">{game.notice}</p>}
    </div>
  );
}
