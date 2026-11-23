"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Coffee, Flag, PlayCircle, RefreshCw } from "lucide-react";
import { CoachPanel } from "@/components/coach/coach-panel";
import { BetSlip } from "@/components/roulette/bet-slip";
import { GameSurface } from "@/components/roulette/game-surface";
import { ProfileEditor, ProfileSummary, StopRulesNote } from "@/components/training/profile-editor";
import { SessionReport } from "@/components/training/session-report";
import { StrategyTracker, trackStrategy } from "@/components/training/strategy-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Stat } from "@/components/ui/form";
import { useNow } from "@/hooks/use-prefs";
import { useRouletteGame } from "@/hooks/use-roulette-game";
import { useT } from "@/lib/i18n";
import * as B from "@/lib/roulette/bets";
import { checkStopRules, stakeAllowance, type StopReason } from "@/lib/training/stop-rules";
import { useAppStore, type SessionRecord } from "@/store/app-store";
import { fmtDuration, fmtMoney } from "@/lib/utils/format";

export function PracticeTable() {
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  const session = useAppStore((s) => s.current.practice);
  const bankroll = useAppStore((s) => s.bankroll);
  const endSession = useAppStore((s) => s.endSession);
  const startSession = useAppStore((s) => s.startSession);
  const resetBankroll = useAppStore((s) => s.resetBankroll);
  const [report, setReport] = useState<SessionRecord | null>(null);
  const [auto, setAuto] = useState(false);
  const [ending, setEnding] = useState(false);
  const [ackBreak, setAckBreak] = useState<{ id: string; slot: number } | null>(null);
  const now = useNow(1000);

  const plan = session?.plan;
  const enforce = settings.enforceStopRules && !!plan;
  const cap = enforce && session ? stakeAllowance(session.startBalance, bankroll, { stopLoss: plan!.stopLoss }) : Infinity;

  const finish = (reason: StopReason | "manual" | "break") => {
    const rec = endSession("practice", reason);
    setAuto(false);
    game.resetTable();
    if (rec && rec.spinCount > 0) setReport(rec);
  };

  const game = useRouletteGame("practice", {
    stakeCap: cap,
    afterSpin: (s) => {
      if (!s?.plan || !settings.enforceStopRules) return;
      // The just-recorded spin's timestamp is "now" for the time-limit check.
      const reason = checkStopRules(s.startBalance, s.balance, s.startedAt, s.spins.at(-1)?.at ?? s.startedAt, { stopLoss: s.plan.stopLoss, stopWin: s.plan.stopWin, timeLimitMins: s.plan.timeLimitMins, minBet: settings.minBet });
      // Stop immediately (no further bets or auto-spins), let the result show, then end. Never restart automatically.
      if (reason) {
        setAuto(false);
        setEnding(true);
        setTimeout(() => { setEnding(false); finish(reason); }, 1800);
      }
    },
  });

  const strategy = settings.practiceStrategy;
  const tracker = strategy && session ? trackStrategy(strategy, settings.practiceBaseBet, game, cap) : null;
  const net = session ? game.balance - session.startBalance : 0;
  const elapsed = session && now ? Math.max(0, now - session.startedAt) : 0;
  const mins = elapsed / 60_000;

  const spinWithMeta = () => game.spin(false, tracker ? { strategyRequired: tracker.required } : {});

  // Educational auto-progression: place the strategy's required bet on Red and spin.
  // Reads the latest game through a ref so the 1-second clock re-render can't reset the timer.
  const live = useRef({ game, cap, t });
  useEffect(() => { live.current = { game, cap, t }; });
  const sessionId = session?.id;
  useEffect(() => {
    if (!auto || ending || !sessionId || game.phase === "spinning" || !strategy) return;
    const id = setTimeout(() => {
      const { game: g, cap: c, t: tr_ } = live.current;
      const tr = trackStrategy(strategy, settings.practiceBaseBet, g, c);
      if (tr.limitFail || tr.bankrollFail) { setAuto(false); g.flash(tr.limitFail ? tr_("tracker.autoStoppedLimit") : tr_("tracker.autoStoppedBankroll")); return; }
      if (!g.spinWith([B.place(B.red(), tr.required)], { strategyRequired: tr.required })) setAuto(false);
    }, game.phase === "result" ? 1400 : 500);
    return () => clearTimeout(id);
  }, [auto, ending, sessionId, game.phase, game.spinId, strategy, settings.practiceBaseBet]);

  // Break reminders: one per interval, acknowledged per session.
  const breakSlot = session && settings.breakReminderMins ? Math.floor(mins / settings.breakReminderMins) : 0;
  const ackedSlot = ackBreak && session && ackBreak.id === session.id ? ackBreak.slot : 0;
  const breakOpen = !!session && !auto && breakSlot > ackedSlot && game.phase !== "spinning";
  const closeBreak = () => session && setAckBreak({ id: session.id, slot: breakSlot });
  const overTime = !!plan && plan.timeLimitMins > 0 && mins >= plan.timeLimitMins;

  const coachInput = useMemo(() => ({
    rules: game.rules,
    bets: game.activeBets,
    balance: game.balance,
    session: session ? { startBalance: session.startBalance, startedAt: session.startedAt, spins: session.spins, stopLoss: plan?.stopLoss || undefined, stopWin: plan?.stopWin || undefined } : null,
    strategy: strategy ? { id: strategy, baseBet: settings.practiceBaseBet } : null,
    now,
    breakReminderMins: settings.breakReminderMins,
  }), [game.rules, game.activeBets, game.balance, session, plan, strategy, settings.practiceBaseBet, settings.breakReminderMins, now]);

  const bust = !!session && game.balance < game.rules.minBet && game.phase !== "spinning" && !game.activeBets.length;

  const startCard = !session && (
    <Card className="border-gold/40">
      <CardHeader><CardTitle>{t("practice.startTitle")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ProfileSummary compact />
        <StopRulesNote />
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => { setReport(null); startSession("practice"); }} disabled={bankroll < settings.minBet}><PlayCircle /> {t("practice.start")}</Button>
          <ProfileEditor />
          {bankroll < settings.practiceBaseBet && <Button variant="secondary" onClick={() => resetBankroll()}><RefreshCw /> {t("practice.resetBank", { amount: fmtMoney(settings.startingBankroll) })}</Button>}
        </div>
        <p className="text-xs text-muted">{t("practice.noAutoRestart")}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <GameSurface
        game={game}
        bettingLocked={!session || auto || ending}
        onSpin={spinWithMeta}
        status={
          <div className="space-y-3">
            {startCard}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label={t("practice.balance")} value={fmtMoney(game.available)} sub={game.stake ? t("practice.onTable", { amount: fmtMoney(game.stake) }) : t("practice.available")} tone="gold" />
              <Stat label={t("practice.session")} value={fmtMoney(net, { sign: true })} tone={net > 0 ? "good" : net < 0 ? "danger" : undefined}
                sub={plan ? t("practice.band", { target: fmtMoney(plan.stopWin), limit: fmtMoney(plan.stopLoss) }) : t("practice.spins", { n: session?.spinCount ?? 0 })} />
              <Stat label={t("practice.time")} value={<span className="inline-flex items-center gap-1"><Clock className="size-4 text-muted" />{fmtDuration(elapsed)}</span>}
                sub={t("profile.minutes", { min: settings.profile.sessionMinMins, max: settings.profile.sessionMaxMins })} tone={overTime ? "warn" : undefined} />
              <Stat label={t("practice.wagered")} value={fmtMoney(session?.wagered ?? 0)} sub={t("practice.expLoss", { amount: fmtMoney(session?.theoreticalLoss ?? 0, { decimals: 2 }) })} />
            </div>
            {plan && session && (
              <div className="space-y-1" aria-label={t("practice.bandLabel")}>
                <div className="flex justify-between text-[11px] text-muted"><span>{fmtMoney(-plan.stopLoss)}</span><span>{fmtMoney(0)}</span><span>{fmtMoney(plan.stopWin, { sign: true })}</span></div>
                <div dir="ltr" className="relative h-2 rounded-full bg-gradient-to-r from-danger/40 via-white/10 to-good/40">
                  <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-gold" style={{ left: `${Math.max(0, Math.min(1, (net + plan.stopLoss) / (plan.stopLoss + plan.stopWin))) * 100}%` }} />
                </div>
              </div>
            )}
            {overTime && <p className="rounded-lg bg-warn/10 p-2 text-sm text-warn">{t("practice.overTime")}</p>}
          </div>
        }
        aside={
          <>
            {strategy && session && (
              <Card><CardContent className="pt-4 sm:pt-5"><StrategyTracker id={strategy} baseBet={settings.practiceBaseBet} game={game} cap={cap} auto={auto} onAutoChange={setAuto} /></CardContent></Card>
            )}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t("slip.title")}</CardTitle>
                <Badge variant="muted">{t(game.rules.wheel === "european" ? "wheel.singleZero" : "wheel.doubleZero")}</Badge>
              </CardHeader>
              <CardContent><BetSlip game={game} /></CardContent>
            </Card>
            <Card><CardContent className="pt-4 sm:pt-5"><CoachPanel input={coachInput} /></CardContent></Card>
            <Card>
              <CardHeader><CardTitle>{t("practice.planTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ProfileSummary />
                <div className="flex flex-wrap gap-2">
                  <ProfileEditor />
                  {session && <Button variant="secondary" size="sm" onClick={() => finish("manual")} disabled={game.phase === "spinning"}><Flag /> {t("practice.end")}</Button>}
                  <Button variant="ghost" size="sm" asChild><Link href="/settings">{t("practice.tableSettings")}</Link></Button>
                </div>
                {!settings.enforceStopRules && <p className="text-xs text-warn">{t("practice.notEnforced")}</p>}
              </CardContent>
            </Card>
          </>
        }
      />

      <Dialog open={breakOpen} onOpenChange={(o) => !o && closeBreak()}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2"><Coffee className="size-5" /> {t("break.title")}</DialogTitle>
          <DialogDescription>{t("break.body", { time: fmtDuration(elapsed), result: fmtMoney(net, { sign: true }) })}</DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={closeBreak}>{t("break.continue")}</Button>
            <Button variant="secondary" onClick={() => { closeBreak(); finish("break"); }}>{t("practice.end")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!report} onOpenChange={(o) => !o && setReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{t("review.title")}</DialogTitle>
          <DialogDescription>{t("review.subtitle")}</DialogDescription>
          {report && <div className="mt-4"><SessionReport rec={report} onClose={() => setReport(null)} /></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={bust && !report} onOpenChange={() => {}}>
        <DialogContent hideClose>
          <DialogTitle>{t("bust.title")}</DialogTitle>
          <DialogDescription>{t("bust.body")}</DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => finish("bankrupt")}>{t("bust.review")}</Button>
            <Button variant="secondary" onClick={() => { finish("bankrupt"); resetBankroll(); }}><RefreshCw /> {t("practice.resetBank", { amount: fmtMoney(settings.startingBankroll) })}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
