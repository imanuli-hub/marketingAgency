"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Coffee, Flag, PlayCircle, RefreshCw } from "lucide-react";
import { BetSlip } from "@/components/roulette/bet-slip";
import { GameSurface } from "@/components/roulette/game-surface";
import { CoachPanel } from "@/components/coach/coach-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select, Stat } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/use-prefs";
import { useRouletteGame } from "@/hooks/use-roulette-game";
import { STRATEGY_INFO } from "@/lib/content/strategies";
import { STRATEGY_IDS, type StrategyId } from "@/lib/roulette/strategies";
import { useAppStore } from "@/store/app-store";
import { fmtDuration, fmtMoney, fmtPct } from "@/lib/utils/format";

export function PracticeTable() {
  const game = useRouletteGame("practice");
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const endSession = useAppStore((s) => s.endSession);
  const startSession = useAppStore((s) => s.startSession);
  const resetBankroll = useAppStore((s) => s.resetBankroll);
  const now = useNow(1000);
  const session = game.session;
  const [ackBreak, setAckBreak] = useState<{ id: string; slot: number } | null>(null);
  const [ackLimit, setAckLimit] = useState<string | null>(null);

  const net = session ? game.balance - session.startBalance : 0;
  const elapsed = session && now ? Math.max(0, now - session.startedAt) : 0;

  // Break reminders: one per elapsed interval, acknowledged per session.
  const breakSlot = session && settings.breakReminderMins ? Math.floor(elapsed / 60000 / settings.breakReminderMins) : 0;
  const ackedSlot = ackBreak && session && ackBreak.id === session.id ? ackBreak.slot : 0;
  const breakOpen = !!session && breakSlot > ackedSlot && game.phase !== "spinning";
  const closeBreak = () => session && setAckBreak({ id: session.id, slot: breakSlot });

  // Stop-loss / stop-win alert, shown once per session.
  const limitHit = !!session && game.phase === "result" &&
    ((settings.practiceStopLoss > 0 && net <= -settings.practiceStopLoss) || (settings.practiceStopWin > 0 && net >= settings.practiceStopWin));
  const limitOpen = limitHit && ackLimit !== session?.id;
  const closeLimit = () => session && setAckLimit(session.id);

  const coachInput = useMemo(() => ({
    rules: game.rules,
    bets: game.activeBets,
    balance: game.balance,
    session: session ? { startBalance: session.startBalance, startedAt: session.startedAt, spins: session.spins, stopLoss: settings.practiceStopLoss || undefined, stopWin: settings.practiceStopWin || undefined } : null,
    strategy: settings.practiceStrategy ? { id: settings.practiceStrategy, baseBet: settings.practiceBaseBet } : null,
    now,
    breakReminderMins: settings.breakReminderMins,
  }), [game.rules, game.activeBets, game.balance, session, settings, now]);

  const bust = game.balance < game.rules.minBet && game.phase !== "spinning" && !game.activeBets.length;

  return (
    <>
      <GameSurface
        game={game}
        status={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Balance" value={fmtMoney(game.available)} sub={game.stake ? `${fmtMoney(game.stake)} on table` : "available"} tone="gold" />
            <Stat label="Session" value={fmtMoney(net, { sign: true })} tone={net > 0 ? "good" : net < 0 ? "danger" : undefined} sub={`${session?.spinCount ?? 0} spins`} />
            <Stat label="Time" value={<span className="inline-flex items-center gap-1"><Clock className="size-4 text-muted" />{fmtDuration(elapsed)}</span>} sub={settings.breakReminderMins ? `break every ${settings.breakReminderMins}m` : "no reminders"} />
            <Stat label="Wagered" value={fmtMoney(session?.wagered ?? 0)} sub={`exp. loss ${fmtMoney(session?.theoreticalLoss ?? 0)}`} />
          </div>
        }
        aside={
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Bet slip</CardTitle>
                <Badge variant="muted">{game.rules.wheel === "european" ? "Single zero" : "Double zero"}{game.rules.evenMoneyRule !== "none" ? ` · ${game.rules.evenMoneyRule === "laPartage" ? "La Partage" : "En Prison"}` : ""}</Badge>
              </CardHeader>
              <CardContent><BetSlip game={game} /></CardContent>
            </Card>
            <Card><CardContent className="pt-4 sm:pt-5"><CoachPanel input={coachInput} /></CardContent></Card>
            <Card>
              <CardHeader><CardTitle>Session plan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Loss limit"><Input type="number" inputMode="decimal" min={0} value={settings.practiceStopLoss || ""} placeholder="off" onChange={(e) => update({ practiceStopLoss: Math.max(0, +e.target.value) })} /></Field>
                  <Field label="Win goal"><Input type="number" inputMode="decimal" min={0} value={settings.practiceStopWin || ""} placeholder="off" onChange={(e) => update({ practiceStopWin: Math.max(0, +e.target.value) })} /></Field>
                </div>
                <Field label="Follow a strategy (coach checks)">
                  <Select value={settings.practiceStrategy ?? ""} onChange={(e) => update({ practiceStrategy: (e.target.value || null) as StrategyId | null })}>
                    <option value="">None</option>
                    {STRATEGY_IDS.filter((s) => s !== "mixed" && s !== "percentage").map((id) => <option key={id} value={id}>{STRATEGY_INFO[id].name}</option>)}
                  </Select>
                </Field>
                {settings.practiceStrategy && (
                  <Field label="Base unit"><Input type="number" min={settings.minBet} value={settings.practiceBaseBet} onChange={(e) => update({ practiceBaseBet: Math.max(settings.minBet, +e.target.value) })} /></Field>
                )}
                <div className="flex flex-wrap gap-2">
                  {session ? (
                    <Button variant="secondary" size="sm" onClick={() => { endSession("practice", "Ended by player"); game.resetTable(); }} disabled={game.phase === "spinning"}><Flag /> End session</Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => startSession("practice")}><PlayCircle /> Start session</Button>
                  )}
                  <Button variant="ghost" size="sm" asChild><Link href="/settings">Table settings</Link></Button>
                </div>
                {session && (
                  <p className="text-xs text-muted">
                    Session return on wagers: {session.wagered ? fmtPct(net / session.wagered) : "—"} · max drawdown {fmtMoney(session.maxDrawdown)}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        }
      />

      <Dialog open={breakOpen} onOpenChange={(o) => !o && closeBreak()}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2"><Coffee className="size-5" /> Time for a break?</DialogTitle>
          <DialogDescription>
            You&apos;ve been at the table for {fmtDuration(elapsed)}. You&apos;re {net >= 0 ? "up" : "down"} {fmtMoney(Math.abs(net))} this session.
            Taking a planned break is a real-casino skill: step away, check your plan, then decide calmly whether to continue.
          </DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={closeBreak}>Continue</Button>
            <Button variant="secondary" onClick={() => { closeBreak(); endSession("practice", "Break taken"); game.resetTable(); }}>End session</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={limitOpen} onOpenChange={(o) => !o && closeLimit()}>
        <DialogContent>
          <DialogTitle>{net < 0 ? "Loss limit reached" : "Win goal reached"}</DialogTitle>
          <DialogDescription>
            {net < 0
              ? `You set a loss limit of ${fmtMoney(settings.practiceStopLoss)} and you're down ${fmtMoney(-net)}. Sticking to it is the habit that protects your real budget.`
              : `You set a win goal of ${fmtMoney(settings.practiceStopWin)} and you're up ${fmtMoney(net)}. Every further spin carries the house edge — this is a good place to stop.`}
          </DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { closeLimit(); endSession("practice", net < 0 ? "Loss limit" : "Win goal"); game.resetTable(); }}>End session (recommended)</Button>
            <Button variant="ghost" onClick={closeLimit}>Keep playing</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bust} onOpenChange={() => {}}>
        <DialogContent hideClose>
          <DialogTitle>Virtual bankroll exhausted</DialogTitle>
          <DialogDescription>This is how bankrolls usually end — gradually through the house edge, or quickly through big bets. Reset to keep practising, and consider a smaller stake size.</DialogDescription>
          <div className="mt-4"><Button onClick={() => { resetBankroll(); game.resetTable(); }}><RefreshCw /> Reset to {fmtMoney(settings.startingBankroll)}</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
