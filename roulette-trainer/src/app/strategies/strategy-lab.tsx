"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FlaskConical, Scale, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CompareResults } from "@/components/sim/sim-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { STRATEGY_INFO, WHAT_CHANGES_EV } from "@/lib/content/strategies";
import { DEFAULT_RULES } from "@/lib/roulette/engine";
import { probLosingStreak } from "@/lib/roulette/probability";
import { compareStrategies, type SimSummary } from "@/lib/roulette/simulator";
import { createStrategy, scriptedProgression, STRATEGY_IDS, type StrategyId } from "@/lib/roulette/strategies";
import { cn } from "@/lib/utils/cn";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

const RISK_VARIANT = { low: "good", medium: "warn", high: "danger", "very high": "danger" } as const;

function lossLadder(id: StrategyId, base: number, max: number, bankroll: number) {
  const s = createStrategy(id, { baseBet: base, percent: 0.02 });
  const rows: { k: number; stake: number; cumulative: number; pStreak: number; p100: number; overMax: boolean; overBankroll: boolean }[] = [];
  let cumulative = 0;
  let bal = bankroll;
  const pLoss = 19 / 37;
  for (let k = 1; k <= 12; k++) {
    const stake = Math.max(1, s.nextStake({ bankroll: bal, minBet: 1, payout: 1 }));
    cumulative += stake;
    bal -= stake;
    rows.push({ k, stake, cumulative, pStreak: pLoss ** k, p100: probLosingStreak(pLoss, k, 100), overMax: stake > max, overBankroll: cumulative > bankroll });
    s.record(-stake, { bankroll: bal, minBet: 1, payout: 1 });
  }
  return rows;
}

export function StrategyLab() {
  const [id, setId] = useState<StrategyId>("martingale");
  const [base, setBase] = useState(5);
  const [max, setMax] = useState(500);
  const [bankroll, setBankroll] = useState(300);
  const [analysis, setAnalysis] = useState<{ id: StrategyId; res: SimSummary[] } | null>(null);
  const [running, setRunning] = useState(false);
  const info = STRATEGY_INFO[id];

  const example = useMemo(() => scriptedProgression(id, { baseBet: base, percent: 0.02 }, info.example, bankroll), [id, base, info.example, bankroll]);
  const ladder = useMemo(() => lossLadder(id, base, max, bankroll), [id, base, max, bankroll]);
  const firstOverMax = ladder.find((r) => r.overMax);
  const firstBust = ladder.find((r) => r.overBankroll);

  const runAnalysis = () => {
    setRunning(true);
    setTimeout(() => {
      const res = compareStrategies(
        { rules: { ...DEFAULT_RULES, maxOutside: max }, params: { baseBet: base, percent: 0.02 }, target: "red", bankroll, spins: 200, sessions: 2000, seed: `lab-${id}`, recordPaths: 0 },
        id === "flat" ? ["flat"] : ["flat", id],
      );
      setAnalysis({ id, res });
      setRunning(false);
    }, 20);
  };

  return (
    <>
      <PageHeader eyebrow="Strategy learning center" title="Strategy Lab" description="How each popular betting system works, what it demands from your bankroll, and how it compares with flat betting on identical spins." />

      <Card className="mb-4 border-gold/30">
        <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="size-5 text-gold" /> Distribution vs expected value</CardTitle></CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-2 text-sm text-foreground/85">
            <p><strong>Betting systems change the <em>shape</em> of your results</strong> — how often you win, how big the swings are, how likely a session ends ahead. They never change the expected value: each unit you wager still loses the house edge on average.</p>
            <p>Because many progressions bet <em>more money in total</em>, they usually increase the expected dollar loss of a session, even while making a small win more likely.</p>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-muted">What actually changes your expected loss</div>
            <ul className="space-y-1.5 text-sm">
              {WHAT_CHANGES_EV.map((w) => <li key={w.title}><strong className="text-gold-strong">{w.title}:</strong> <span className="text-foreground/80">{w.body}</span></li>)}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist">
        {STRATEGY_IDS.map((s) => (
          <button key={s} role="tab" aria-selected={s === id} onClick={() => setId(s)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm touch-manipulation", s === id ? "border-gold/60 bg-gold/15 text-gold-strong" : "border-border text-muted hover:text-foreground")}>
            {STRATEGY_INFO[s].name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{info.name}</CardTitle>
                <Badge variant="muted">{info.family}</Badge>
                <Badge variant={RISK_VARIANT[info.risk]}>{info.risk} risk</Badge>
                <Badge variant="danger">EV unchanged: −2.70% of wagers</Badge>
              </div>
              <CardDescription className="text-base">{info.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground/85">{info.how.map((h) => <li key={h}>{h}</li>)}</ol>
              <p className="rounded-xl bg-black/30 p-3 text-sm"><strong className="text-gold-strong">What it really does: </strong>{info.effect}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs uppercase tracking-wide text-good">Strengths</div>
                  <ul className="space-y-1.5 text-sm">{info.strengths.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />{s}</li>)}</ul>
                </div>
                <div>
                  <div className="mb-1.5 text-xs uppercase tracking-wide text-danger">Weaknesses</div>
                  <ul className="space-y-1.5 text-sm">{info.weaknesses.map((s) => <li key={s} className="flex gap-2"><XCircle className="mt-0.5 size-4 shrink-0 text-danger" />{s}</li>)}</ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Step-by-step example</CardTitle><CardDescription>Even-money bets, base {fmtMoney(base)}, starting bankroll {fmtMoney(bankroll)}. W = win, L = loss.</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[480px] text-sm tabular-nums">
                  <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                    <tr><th className="px-3 py-2">Spin</th><th className="px-3 py-2">System state</th><th className="px-3 py-2">Stake</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Net</th><th className="px-3 py-2">Bankroll</th></tr>
                  </thead>
                  <tbody>
                    {example.map((r) => (
                      <tr key={r.spin} className="border-t border-border/60">
                        <td className="px-3 py-2">{r.spin}</td>
                        <td className="px-3 py-2 text-xs text-muted">{r.state}</td>
                        <td className="px-3 py-2">{fmtMoney(r.stake)}</td>
                        <td className={cn("px-3 py-2 font-semibold", r.result === "W" ? "text-good" : "text-danger")}>{r.result}</td>
                        <td className="px-3 py-2">{fmtMoney(r.net, { sign: true })}</td>
                        <td className="px-3 py-2">{fmtMoney(r.bankroll)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bankroll requirements & table limits</CardTitle>
              <CardDescription>What a run of consecutive losses demands. Probabilities are for an even-money bet on a European wheel (lose 19/37).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-sm tabular-nums">
                  <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                    <tr><th className="px-3 py-2">Losses in a row</th><th className="px-3 py-2">Stake on that spin</th><th className="px-3 py-2">Total lost</th><th className="px-3 py-2">P(starting now)</th><th className="px-3 py-2">P(at least once in 100 spins)</th></tr>
                  </thead>
                  <tbody>
                    {ladder.map((r) => (
                      <tr key={r.k} className={cn("border-t border-border/60", (r.overMax || r.overBankroll) && "bg-danger/5")}>
                        <td className="px-3 py-1.5">{r.k}</td>
                        <td className={cn("px-3 py-1.5", r.overMax && "text-danger")}>{fmtMoney(r.stake)}{r.overMax && " ⚠ over max"}</td>
                        <td className={cn("px-3 py-1.5", r.overBankroll && "text-danger")}>{fmtMoney(r.cumulative)}</td>
                        <td className="px-3 py-1.5">{fmtPct(r.pStreak, r.pStreak < 0.01 ? 2 : 1)}</td>
                        <td className="px-3 py-1.5">{fmtPct(r.p100, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted">
                {info.bankrollNote}{" "}
                {firstOverMax ? `With a ${fmtMoney(max)} table maximum the progression breaks after ${firstOverMax.k - 1} straight losses.` : `The table maximum of ${fmtMoney(max)} isn't reached within 12 losses.`}{" "}
                {firstBust ? `Your ${fmtMoney(bankroll)} bankroll is exhausted by a run of ${firstBust.k} losses.` : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Your parameters</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Base unit ($)"><Input type="number" min={1} value={base} onChange={(e) => setBase(Math.max(1, +e.target.value))} /></Field>
              <Field label="Table maximum ($)"><Input type="number" min={1} value={max} onChange={(e) => setMax(Math.max(1, +e.target.value))} /></Field>
              <Field label="Session bankroll ($)"><Input type="number" min={1} value={bankroll} onChange={(e) => setBankroll(Math.max(1, +e.target.value))} /></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Quick analysis</CardTitle><CardDescription>2,000 sessions × 200 spins on Red, vs flat betting on identical spins.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={runAnalysis} disabled={running}><FlaskConical /> {running ? "Running…" : "Run analysis"}</Button>
              <Button variant="ghost" className="w-full" asChild><Link href="/simulator">Open full simulator</Link></Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {analysis && analysis.id === id && (
        <Card className="mt-4">
          <CardHeader><CardTitle>{analysis.res.length > 1 ? `${info.name} vs Flat Betting` : "Flat Betting baseline"}</CardTitle></CardHeader>
          <CardContent><CompareResults results={analysis.res} /></CardContent>
        </Card>
      )}
    </>
  );
}
