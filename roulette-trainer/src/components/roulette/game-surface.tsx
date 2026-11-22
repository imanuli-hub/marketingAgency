"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useMediaQuery, useMotionReduced } from "@/hooks/use-prefs";
import type { RouletteGame } from "@/hooks/use-roulette-game";
import type { Orientation } from "@/lib/roulette/layout";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
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

export function GameSurface({
  game, aside, status, dealer, bettingLocked, hideSpin, spinLabel,
}: {
  game: RouletteGame;
  aside?: ReactNode;
  status?: ReactNode;
  dealer?: ReactNode;
  bettingLocked?: boolean;
  hideSpin?: boolean;
  spinLabel?: string;
}) {
  const reduced = useMotionReduced();
  const orientation = useTableOrientation();
  const mobile = useMediaQuery("(max-width: 767px)");
  const [dismissedSpin, setDismissedSpin] = useState(0);
  const spinning = game.phase === "spinning";
  // Keep the mobile overlay open briefly after the ball lands so the result is seen.
  const overlayResult = mobile && game.phase === "result" && dismissedSpin !== game.spinId;
  useEffect(() => {
    if (!overlayResult) return;
    const id = game.spinId;
    const t = setTimeout(() => setDismissedSpin(id), reduced ? 900 : 1600);
    return () => clearTimeout(t);
  }, [overlayResult, game.spinId, reduced]);

  const overlay = mobile && (spinning || overlayResult);
  const pockets = (game.session?.spins ?? []).map((s) => s.pocket);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {status}
        <div className="grid items-center gap-4 grid-cols-1 md:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
          <div
            className={cn(
              overlay
                ? "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 backdrop-blur-sm"
                : "relative mx-auto w-40 sm:w-52 md:w-full",
            )}
            onClick={() => overlayResult && setDismissedSpin(game.spinId)}
          >
            <RouletteWheel
              wheel={game.rules.wheel}
              result={game.result}
              spinId={game.spinId}
              reduced={reduced}
              onSettled={game.onSettled}
              highlight={game.phase === "result" ? game.result : null}
              className={overlay ? "w-[min(86vw,420px)]" : undefined}
            />
            {overlay && game.phase === "result" && game.result !== null && (
              <div className="flex items-center gap-3 text-lg">
                <PocketBadge pocket={game.result} size="lg" />
                {game.settlement && game.settlement.staked + game.settlement.returned > 0 && (
                  <span className={game.settlement.net > 0 ? "text-good" : game.settlement.net < 0 ? "text-danger" : ""}>
                    {game.settlement.net > 0 ? "+" : ""}{game.settlement.net.toFixed(game.settlement.net % 1 ? 2 : 0)}
                  </span>
                )}
              </div>
            )}
            {overlay && spinning && <p className="text-sm text-muted">No more bets</p>}
          </div>
          <div className="min-w-0 space-y-3">
            {dealer}
            <ResultBanner settlement={game.phase === "result" ? game.settlement : null} reduced={reduced} spinId={game.spinId} />
            {game.phase !== "result" && !dealer && (
              <div className="rounded-2xl border border-border bg-black/30 p-3 text-sm text-muted">
                {spinning ? "The ball is in motion — no more bets." : game.activeBets.length ? "Bets placed. Spin when ready." : "Place your bets."}
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
          className={orientation === "vertical" ? "mx-auto max-w-[420px]" : undefined}
        />
        <p className="text-center text-[11px] text-muted md:text-left">
          Tap a number for straight-up, an edge for a split, an intersection for a corner, the outer edge for a street or six line. {orientation === "horizontal" && "Right-click a chip to remove it."}
        </p>

        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-30 -mx-4 border-t border-border bg-background/90 px-4 py-2 backdrop-blur-md md:static md:mx-0 md:rounded-2xl md:border md:bg-surface/80 lg:bottom-0">
          <ControlBar game={game} hideSpin={hideSpin} spinLabel={spinLabel} />
        </div>
      </div>
      <aside className="min-w-0 space-y-4">{aside}</aside>
    </div>
  );
}
