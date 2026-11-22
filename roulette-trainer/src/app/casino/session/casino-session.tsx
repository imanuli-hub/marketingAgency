"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Coffee, DoorOpen, Hand, Timer } from "lucide-react";
import { PlanForm } from "@/components/casino/plan-form";
import { CoachPanel } from "@/components/coach/coach-panel";
import { PageHeader } from "@/components/layout/page-header";
import { BetSlip } from "@/components/roulette/bet-slip";
import { GameSurface } from "@/components/roulette/game-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress, Stat } from "@/components/ui/form";
import { useNow } from "@/hooks/use-prefs";
import { useRouletteGame } from "@/hooks/use-roulette-game";
import { useSound } from "@/hooks/use-sound";
import { HOUSE_EDGE } from "@/lib/roulette/probability";
import { useAppStore, type SessionRecord } from "@/store/app-store";
import { fmtDuration, fmtMoney, fmtPct } from "@/lib/utils/format";

type Dealer = "open" | "closing" | "spinning" | "paying" | "paused";

function adherence(rec: SessionRecord) {
  const plan = rec.plan!;
  const spins = rec.spins;
  let chase = 0;
  for (let i = 1; i < spins.length; i++) if (spins[i - 1].net < 0 && spins[i].staked > spins[i - 1].staked * 1.4) chase++;
  const oversized = spins.filter((s) => s.staked > plan.unit * 4).length;
  const net = rec.balance - rec.startBalance;
  const beyondLimit = -net > plan.stopLoss + 1e-9;
  let score = 100 - chase * 10 - oversized * 5 - (beyondLimit ? 30 : 0);
  score = Math.max(0, Math.min(100, score));
  return { chase, oversized, net, score };
}

export function CasinoSession() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const startSession = useAppStore((s) => s.startSession);
  const endSession = useAppStore((s) => s.endSession);
  const casinoSession = useAppStore((s) => s.current.casino);
  const plan = casinoSession?.plan ?? settings.casinoPlan;
  // Stopping rules are enforced: you can never stake more than the remaining loss allowance.
  const allowance = casinoSession ? plan.stopLoss + (casinoSession.balance - casinoSession.startBalance) : plan.stopLoss;
  const game = useRouletteGame("casino", { stakeCap: Math.max(0, allowance) });
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
    setSummary(rec ? { ...rec, endReason: reason } : null);
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

  // "No more bets" → spin.
  useEffect(() => {
    if (dealer !== "closing") return;
    const t = setTimeout(() => { gameRef.current.spin(true); setDealer("spinning"); }, 1200);
    return () => clearTimeout(t);
  }, [dealer]);

  // Ball landed → payout pause → check stopping rules → reopen betting.
  const paying = dealer === "spinning" && game.phase === "result";
  const shown: Dealer = paying ? "paying" : dealer;
  useEffect(() => {
    if (!paying) return;
    const t = setTimeout(() => {
      const st = useAppStore.getState().current.casino;
      if (!st || !st.plan) return;
      const n = st.balance - st.startBalance;
      if (n <= -st.plan.stopLoss + 1e-9) return finish("Loss limit reached");
      if (st.plan.stopWin && n >= st.plan.stopWin) return finish("Win goal reached");
      if (Date.now() - st.startedAt >= st.plan.timeLimitMins * 60_000) return finish("Time limit reached");
      if (st.balance < gameRef.current.rules.minBet) return finish("Budget exhausted");
      openBetting(st.plan.bettingSeconds);
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paying]);

  // Cap stakes so a losing spin can never exceed the loss limit.
  const remainingLoss = plan.stopLoss + net;

  const coachInput = useMemo(() => ({
    rules: game.rules,
    bets: game.activeBets,
    balance: game.balance,
    session: session ? { startBalance: session.startBalance, startedAt: session.startedAt, spins: session.spins, stopLoss: plan.stopLoss, stopWin: plan.stopWin || undefined } : null,
    now,
  }), [game.rules, game.activeBets, game.balance, session, plan, now]);

  if (!session) {
    return (
      <>
        <PageHeader eyebrow="Casino rehearsal" title="Sit down at the table" description="A realistic session: the dealer controls the pace, betting closes when the timer ends, and your stopping rules are enforced automatically." />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader><CardTitle>Session plan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PlanForm plan={settings.casinoPlan} onChange={(p) => update({ casinoPlan: p })} edge={settings.wheel === "european" ? HOUSE_EDGE.european : HOUSE_EDGE.american} />
              <Button size="lg" disabled={settings.casinoPlan.stopLoss > settings.casinoPlan.budget || settings.casinoPlan.unit < settings.minBet}
                onClick={() => { ended.current = false; startSession("casino", { balance: settings.casinoPlan.budget, plan: settings.casinoPlan }); openBetting(settings.casinoPlan.bettingSeconds); }}>
                Buy in for {fmtMoney(settings.casinoPlan.budget)} and sit down
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>How it works</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>• &ldquo;Place your bets&rdquo; — you have {settings.casinoPlan.bettingSeconds}s. Tap <em>Done betting</em> to hurry the dealer.</p>
              <p>• &ldquo;No more bets&rdquo; — the table locks and the wheel spins, with or without your bets.</p>
              <p>• The session ends automatically at your loss limit, win goal, time limit or when the budget runs out.</p>
              <p>• Table: {settings.wheel === "european" ? "single zero" : "double zero"}, min {fmtMoney(settings.minBet)}. Change in <Link className="text-gold underline" href="/settings">Settings</Link>.</p>
            </CardContent>
          </Card>
        </div>
        <SummaryDialog summary={summary} onClose={() => setSummary(null)} />
      </>
    );
  }

  const dealerBanner = (
    <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-black/40 p-3">
      {shown === "open" ? <Hand className="size-6 text-gold" /> : shown === "paused" ? <Coffee className="size-6 text-info" /> : <Timer className="size-6 text-warn" />}
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg">
          {shown === "open" && "“Place your bets.”"}
          {shown === "closing" && "“No more bets!”"}
          {shown === "spinning" && "Ball in motion…"}
          {shown === "paying" && "Dealer is paying winners"}
          {shown === "paused" && "You're sitting out"}
        </div>
        {dealer === "open" && <Progress value={secondsLeft / plan.bettingSeconds} tone={secondsLeft <= 5 ? "warn" : "gold"} className="mt-1.5" />}
      </div>
      {dealer === "open" && <span className="text-2xl font-semibold tabular-nums text-gold-strong">{secondsLeft}s</span>}
      {dealer === "open" && <Button size="sm" variant="outline" onClick={() => setDeadline(Date.now())}>Done betting</Button>}
      {dealer === "paused" && <Button size="sm" onClick={() => openBetting(plan.bettingSeconds)}>Rejoin</Button>}
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
            <Stat label="Chips" value={fmtMoney(game.available)} tone="gold" sub={`bought in ${fmtMoney(session.startBalance)}`} />
            <Stat label="Result" value={fmtMoney(net, { sign: true })} tone={net > 0 ? "good" : net < 0 ? "danger" : undefined} sub={`limit −${fmtMoney(plan.stopLoss)} / goal +${fmtMoney(plan.stopWin)}`} />
            <Stat label="Time" value={<span className="inline-flex items-center gap-1"><Clock className="size-4 text-muted" />{fmtDuration(elapsed)}</span>} sub={`limit ${plan.timeLimitMins} min`} />
            <Stat label="Loss allowance" value={fmtMoney(Math.max(0, remainingLoss))} sub={`${session.spinCount} spins played`} tone={remainingLoss < plan.stopLoss * 0.25 ? "warn" : undefined} />
          </div>
        }
        aside={
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between"><CardTitle>Your bets</CardTitle><Badge variant="muted">unit {fmtMoney(plan.unit)}</Badge></CardHeader>
              <CardContent className="space-y-3">
                <BetSlip game={game} />
                {game.stake > remainingLoss && <p className="rounded-lg bg-danger/10 p-2 text-xs text-danger">Losing this spin would take you past your loss limit.</p>}
                {game.stake > plan.unit * 4 && <p className="rounded-lg bg-warn/10 p-2 text-xs text-warn">You&apos;re staking {(game.stake / plan.unit).toFixed(1)}× your planned unit.</p>}
              </CardContent>
            </Card>
            <Card><CardContent className="pt-5"><CoachPanel input={coachInput} limit={4} /></CardContent></Card>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" disabled={dealer !== "open"} onClick={() => { game.clear(); setDealer("paused"); }}><Coffee /> Sit out</Button>
              <Button variant="secondary" className="flex-1" disabled={dealer === "spinning" || dealer === "closing"} onClick={() => finish("Left the table by choice")}><DoorOpen /> Leave table</Button>
            </div>
          </>
        }
      />
      <SummaryDialog summary={summary} onClose={() => setSummary(null)} />
    </>
  );
}

function SummaryDialog({ summary, onClose }: { summary: SessionRecord | null; onClose: () => void }) {
  if (!summary || !summary.plan) return null;
  const a = adherence(summary);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>{summary.endReason}</DialogTitle>
        <DialogDescription>Session summary — compare it with what you planned.</DialogDescription>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Result" value={fmtMoney(a.net, { sign: true })} tone={a.net >= 0 ? "good" : "danger"} />
          <Stat label="Spins" value={summary.spinCount} sub={`${fmtDuration((summary.endedAt ?? summary.startedAt) - summary.startedAt)}`} />
          <Stat label="Total wagered" value={fmtMoney(summary.wagered)} sub={`expected loss ${fmtMoney(summary.theoreticalLoss)}`} />
          <Stat label="Return on wagers" value={summary.wagered ? fmtPct(a.net / summary.wagered) : "—"} />
          <Stat label="Raised after loss" value={a.chase} tone={a.chase ? "warn" : "good"} />
          <Stat label="Plan discipline" value={`${a.score}/100`} tone={a.score >= 80 ? "good" : "warn"} />
        </div>
        <p className="mt-3 text-sm text-muted">
          {a.score >= 80 ? "Well played — you followed your plan. That's the skill that matters at a real casino." : "Review the moments you raised stakes after losses or went beyond your planned unit. Those are the habits to fix before your visit."}
        </p>
        <div className="mt-4 flex gap-2"><Button onClick={onClose}>Done</Button><Button variant="ghost" asChild><Link href="/history">View history</Link></Button></div>
      </DialogContent>
    </Dialog>
  );
}
