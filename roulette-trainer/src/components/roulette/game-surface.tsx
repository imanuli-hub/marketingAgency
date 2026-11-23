"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useMediaQuery, useMotionReduced } from "@/hooks/use-prefs";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import type { BetSpec } from "@/lib/roulette/bets";
import type { Orientation } from "@/lib/roulette/layout";
import { pocketLabel } from "@/lib/roulette/wheel";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { fmtMoney } from "@/lib/utils/format";
import { BettingTable } from "./betting-table";
import { ControlBar } from "./control-bar";
import { PocketBadge } from "./pocket-badge";
import { RecentResults } from "./recent-results";
import { ResultBanner } from "./result-banner";
import { RouletteWheel } from "./wheel";

export function useTableOrientation(): Orientation {
  const pref = useAppStore((s) => s.settings.orientation);
  const narrow = useMediaQuery("(max-width: 767px)");
  return pref === "auto" ? (narrow ? "vertical" : "horizontal") : pref;
}

/** Phones in portrait or landscape: the wheel lifts into a full-screen overlay while it spins. */
export function useCompactScreen() {
  return useMediaQuery("(max-width: 767px), (max-height: 500px)");
}

export function GameSurface({
  game, aside, status, dealer, bettingLocked, hideSpin, spinLabel, targets, explainResults, lockChips, footer, onSpin,
}: {
  game: RouletteGame;
  aside?: ReactNode;
  status?: ReactNode;
  dealer?: ReactNode;
  bettingLocked?: boolean;
  hideSpin?: boolean;
  spinLabel?: string;
  targets?: readonly BetSpec[];
  explainResults?: boolean;
  lockChips?: boolean;
  footer?: ReactNode;
  onSpin?: () => void;
}) {
  const t = useT();
  const reduced = useMotionReduced();
  const orientation = useTableOrientation();
  const compact = useCompactScreen();
  const [dismissedSpin, setDismissedSpin] = useState(0);
  const spinning = game.phase === "spinning";
  const overlayResult = compact && game.phase === "result" && dismissedSpin !== game.spinId;
  useEffect(() => {
    if (!overlayResult) return;
    const id = game.spinId;
    const tm = setTimeout(() => setDismissedSpin(id), reduced ? 900 : 1700);
    return () => clearTimeout(tm);
  }, [overlayResult, game.spinId, reduced]);

  const overlay = compact && (spinning || overlayResult);
  const pockets = (game.session?.spins ?? []).map((s) => s.pocket);
  const wheelLabel = t(game.rules.wheel === "european" ? "a11y.wheelEu" : "a11y.wheelUs") + (game.phase === "result" && game.result !== null ? ` — ${pocketLabel(game.result)}` : "");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {status}
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
          <div
            className={cn(overlay ? "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 backdrop-blur-sm" : "relative mx-auto w-40 sm:w-52 md:w-full")}
            onClick={() => overlayResult && setDismissedSpin(game.spinId)}
          >
            <RouletteWheel
              wheel={game.rules.wheel}
              result={game.result}
              spinId={game.spinId}
              reduced={reduced}
              onSettled={game.onSettled}
              highlight={game.phase === "result" ? game.result : null}
              className={overlay ? "w-[min(80vw,72dvh,420px)]" : undefined}
              label={wheelLabel}
            />
            {overlay && game.phase === "result" && game.result !== null && (
              <div className="flex items-center gap-3 text-lg">
                <PocketBadge pocket={game.result} size="lg" />
                {game.settlement && game.settlement.staked + game.settlement.returned > 0 && (
                  <span className={game.settlement.net > 0 ? "text-good" : game.settlement.net < 0 ? "text-danger" : ""}>
                    {fmtMoney(game.settlement.net, { sign: true })}
                  </span>
                )}
              </div>
            )}
            {overlay && spinning && <p className="text-sm text-muted">{t("dealer.noMoreBets")}</p>}
          </div>
          <div className="min-w-0 space-y-3">
            {dealer}
            <ResultBanner settlement={game.phase === "result" ? game.settlement : null} reduced={reduced} spinId={game.spinId} explain={explainResults} />
            {game.phase !== "result" && !dealer && (
              <div className="rounded-2xl border border-border bg-black/30 p-3 text-sm text-muted">
                {spinning ? t("surface.inMotion") : game.activeBets.length ? t("surface.ready") : t("surface.place")}
              </div>
            )}
            <RecentResults pockets={pockets} />
          </div>
        </div>

        <BettingTable
          wheel={game.rules.wheel}
          orientation={orientation}
          bets={game.shownBets}
          winning={game.phase === "result" ? game.result : null}
          winningKeys={game.phase === "result" ? game.winningKeys : []}
          onPlace={(spec) => game.placeBet(spec)}
          onRemove={(spec) => game.removeBet(spec.key)}
          disabled={spinning || bettingLocked}
          targets={targets}
          className={orientation === "vertical" ? "mx-auto max-w-[420px]" : undefined}
        />
        <p className="text-center text-[11px] text-muted md:text-start">
          {t("surface.help")} {orientation === "horizontal" && t("surface.helpDesktop")}
        </p>
        {footer}

        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+3.75rem)] z-30 -mx-4 border-t border-border bg-background/90 px-4 py-2 backdrop-blur-md md:static md:mx-0 md:rounded-2xl md:border md:bg-surface/80 lg:bottom-0">
          <ControlBar game={game} hideSpin={hideSpin || bettingLocked} spinLabel={spinLabel} lockChips={lockChips} onSpin={onSpin} />
        </div>
      </div>
      <aside className="min-w-0 space-y-4">{aside}</aside>
    </div>
  );
}
