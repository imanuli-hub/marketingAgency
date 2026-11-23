"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Coffee, DoorOpen, Hand, Timer } from "lucide-react";
import { PlanForm } from "@/components/casino/plan-form";
import { CoachPanel } from "@/components/coach/coach-panel";
import { PageHeader } from "@/components/layout/page-header";
import { BetSlip } from "@/components/roulette/bet-slip";
import { GameSurface } from "@/components/roulette/game-surface";
import { StopRulesNote } from "@/components/training/profile-editor";
import { SessionReport } from "@/components/training/session-report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Progress, Stat } from "@/components/ui/form";
import { useNow } from "@/hooks/use-prefs";
import { useRouletteGame } from "@/hooks/use-roulette-game";
import { useSound } from "@/hooks/use-sound";
import { useT } from "@/lib/i18n";
import { HOUSE_EDGE } from "@/lib/roulette/probability";
import { checkStopRules, stakeAllowance } from "@/lib/training/stop-rules";
import { useAppStore, type SessionRecord } from "@/store/app-store";
import { fmtDuration, fmtMoney } from "@/lib/utils/format";

type Dealer = "open" | "closing" | "spinning" | "paying" | "paused";

export function CasinoSession() {
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const startSession = useAppStore((s) => s.startSession);
  const endSession = useAppStore((s) => s.endSession);
  const casinoSession = useAppStore((s) => s.current.casino);
  const plan = casinoSession?.plan ?? settings.casinoPlan;
  // Stopping rules are enforced: you can never stake more than the remaining loss allowance.
  const cap = casinoSession ? stakeAllowance(casinoSession.startBalance, casinoSession.balance, plan) : plan.stopLoss;
  const game = useRouletteGame("casino", { stakeCap: cap });
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; });
  const play = useSound();
  const now = useNow(250);
  const session = game.session;
  // Starts "paused" so a reloaded session waits for the player to rejoin.
  const [dealer, setDealer] = useState<Dealer>("paused");
  const [deadline, setDeadline] = useState(0);
  const [summary, setSummary] = useState<SessionRecord | null>(null);
  const ended = useRef(false);

  const elapsed = session && now ? Math.max(0, now - session.startedAt) : 0;
  const net = session ? game.balance - session.startBalance : 0;
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));

  const finish = (reason: string) => {
    if (ended.current) return;
    ended.current = true;
    const rec = endSession("casino", reason);
    gameRef.current.resetTable();
    setDealer("paused");
    setSummary(rec && rec.spinCount > 0 ? rec : null);
  };

  const openBetting = (secs: number) => { setDealer("open"); setDeadline(Date.now() + secs * 1000); };

  // Dealer: close betting when the timer runs out.
  useEffect(() => {
    if (dealer !== "open" || !deadline) return;
    const id = setInterval(() => {
      if (Date.now() >= deadline) { clearInterval(id); setDealer("closing"); play("bell"); }
    }, 200);
    return () => clearInterval(id);
  }, [dealer, deadline, play]);

  // "No more bets" → spin (the wheel spins even if you have no bets).
  useEffect(() => {
    if (dealer !== "closing") return;
    const tm = setTimeout(() => { gameRef.current.spin(true); setDealer("spinning"); }, 1200);
    return () => clearTimeout(tm);
  }, [dealer]);

  // Ball landed → payout pause → check stopping rules → reopen betting. Never restarts after a rule.
  const paying = dealer === "spinning" && game.phase === "result";
  const shown: Dealer = paying ? "paying" : dealer;
  useEffect(() => {
    if (!paying) return;
    const tm = setTimeout(() => {
      const st = useAppStore.getState().current.casino;
      if (!st || !st.plan) return;
      const reason = checkStopRules(st.startBalance, st.balance, st.startedAt, Date.now(), { stopLoss: st.plan.stopLoss, stopWin: st.plan.stopWin, timeLimitMins: st.plan.timeLimitMins, minBet: gameRef.current.rules.minBet });
      if (reason) return finish(reason);
      openBetting(st.plan.bettingSeconds);
    }, 3000);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paying]);

  const coachInput = useMemo(() => ({
    rules: game.rules,
    bets: game.activeBets,
    balance: game.balance,
    session: session ? { startBalance: session.startBalance, startedAt: session.startedAt, spins: session.spins, stopLoss: plan.stopLoss, stopWin: plan.stopWin || undefined } : null,
    strategy: { id: settings.profile.strategy, baseBet: plan.unit },
    now,
  }), [game.rules, game.activeBets, game.balance, session, plan, now, settings.profile.strategy]);

  const summaryDialog = (
    <Dialog open={!!summary} onOpenChange={(o) => !o && setSummary(null)}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{t("review.title")}</DialogTitle>
        <DialogDescription>{t("casino.ended")}</DialogDescription>
        {summary && <div className="mt-4"><SessionReport rec={summary} onClose={() => setSummary(null)} /></div>}
      </DialogContent>
    </Dialog>
  );

  if (!session) {
    const num = (k: "minBet" | "maxInside" | "maxOutside") => (e: React.ChangeEvent<HTMLInputElement>) => update({ [k]: Math.max(1, Number(e.target.value)) });
    return (
      <>
        <PageHeader eyebrow={t("casino.eyebrow")} title={t("casino.sitTitle")} description={t("casino.sitDesc")} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader><CardTitle>{t("casino.plan")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PlanForm plan={settings.casinoPlan} onChange={(p) => update({ casinoPlan: p })} edge={settings.wheel === "european" ? HOUSE_EDGE.european : HOUSE_EDGE.american} />
              <div className="grid grid-cols-3 gap-3">
                <Field label={t("simLab.min")}><Input type="number" min={1} value={settings.minBet} onChange={num("minBet")} /></Field>
                <Field label={t("simLab.maxIn")}><Input type="number" min={1} value={settings.maxInside} onChange={num("maxInside")} /></Field>
                <Field label={t("simLab.maxOut")}><Input type="number" min={1} value={settings.maxOutside} onChange={num("maxOutside")} /></Field>
              </div>
              <StopRulesNote />
              <Button size="lg" disabled={settings.casinoPlan.stopLoss > settings.casinoPlan.budget || settings.casinoPlan.unit < settings.minBet}
                onClick={() => { ended.current = false; setSummary(null); startSession("casino", { balance: settings.casinoPlan.budget, plan: settings.casinoPlan }); openBetting(settings.casinoPlan.bettingSeconds); }}>
                {t("casino.buyIn", { amount: fmtMoney(settings.casinoPlan.budget) })}
              </Button>
              {settings.casinoPlan.unit < settings.minBet && <p className="text-sm text-warn">{t("casino.unitBelowMin")}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("casino.howTitle")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>• {t("casino.how1", { s: settings.casinoPlan.bettingSeconds })}</p>
              <p>• {t("casino.how2")}</p>
              <p>• {t("casino.how3")}</p>
              <p>• {t("casino.how4")} <Link className="text-gold underline" href="/settings">{t("nav.settings")}</Link></p>
            </CardContent>
          </Card>
        </div>
        {summaryDialog}
      </>
    );
  }

  const dealerBanner = (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-black/40 p-3" role="status" aria-live="assertive">
      {shown === "open" ? <Hand className="size-6 text-gold" aria-hidden /> : shown === "paused" ? <Coffee className="size-6 text-info" aria-hidden /> : <Timer className="size-6 text-warn" aria-hidden />}
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg">{t(`dealer.${shown}`)}</div>
        {dealer === "open" && <Progress value={secondsLeft / plan.bettingSeconds} tone={secondsLeft <= 5 ? "warn" : "gold"} className="mt-1.5" />}
      </div>
      {dealer === "open" && <span className="text-2xl font-semibold tabular-nums text-gold-strong">{secondsLeft}s</span>}
      {dealer === "open" && <Button size="sm" variant="outline" onClick={() => setDeadline(Date.now())}>{t("dealer.done")}</Button>}
      {dealer === "paused" && <Button size="sm" onClick={() => openBetting(plan.bettingSeconds)}>{t("dealer.rejoin")}</Button>}
    </div>
  );

  return (
    <>
      <GameSurface
        game={game}
        hideSpin
        bettingLocked={dealer !== "open"}
        dealer={dealerBanner}
        status={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t("casino.chips")} value={fmtMoney(game.available)} tone="gold" sub={t("casino.boughtIn", { amount: fmtMoney(session.startBalance) })} />
            <Stat label={t("casino.result")} value={fmtMoney(net, { sign: true })} tone={net > 0 ? "good" : net < 0 ? "danger" : undefined} sub={t("practice.band", { target: fmtMoney(plan.stopWin), limit: fmtMoney(plan.stopLoss) })} />
            <Stat label={t("practice.time")} value={<span className="inline-flex items-center gap-1"><Clock className="size-4 text-muted" />{fmtDuration(elapsed)}</span>} sub={t("casino.limitMin", { n: plan.timeLimitMins })} />
            <Stat label={t("casino.allowance")} value={fmtMoney(cap)} sub={t("practice.spins", { n: session.spinCount })} tone={cap < plan.stopLoss * 0.25 ? "warn" : undefined} />
          </div>
        }
        aside={
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between"><CardTitle>{t("casino.yourBets")}</CardTitle><Badge variant="muted">{t("casino.unit", { amount: fmtMoney(plan.unit) })}</Badge></CardHeader>
              <CardContent className="space-y-3">
                <BetSlip game={game} />
                {game.stake > plan.unit * 4 && <p className="rounded-lg bg-warn/10 p-2 text-xs text-warn">{t("casino.oversized", { x: (game.stake / plan.unit).toFixed(1) })}</p>}
              </CardContent>
            </Card>
            <Card><CardContent className="pt-5"><CoachPanel input={coachInput} limit={5} /></CardContent></Card>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" disabled={dealer !== "open"} onClick={() => { game.clear(); setDealer("paused"); }}><Coffee /> {t("casino.sitOut")}</Button>
              <Button variant="secondary" className="flex-1" disabled={dealer === "spinning" || dealer === "closing"} onClick={() => finish("manual")}><DoorOpen /> {t("casino.leave")}</Button>
            </div>
          </>
        }
      />
      {summaryDialog}
    </>
  );
}
