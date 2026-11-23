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
import { WHAT_CHANGES_EV } from "@/lib/content/strategies";
import { strategyInfo, WHAT_CHANGES_EV_HE } from "@/lib/content/strategies.he";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { DEFAULT_RULES } from "@/lib/roulette/engine";
import { probLosingStreak } from "@/lib/roulette/probability";
import { compareStrategies, type SimSummary } from "@/lib/roulette/simulator";
import { createStrategy, scriptedProgression, STRATEGY_IDS, type StrategyId } from "@/lib/roulette/strategies";
import { useAppStore } from "@/store/app-store";
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
  const t = useT();
  const locale = useLocale();
  const settings = useAppStore((s) => s.settings);
  const [id, setId] = useState<StrategyId>("martingale");
  const [base, setBase] = useState(settings.profile.baseBet);
  const [max, setMax] = useState(settings.maxOutside);
  const [bankroll, setBankroll] = useState(settings.profile.bankroll);
  const [analysis, setAnalysis] = useState<{ id: StrategyId; res: SimSummary[] } | null>(null);
  const [running, setRunning] = useState(false);
  const info = strategyInfo(id, locale);
  const changes = locale === "he" ? WHAT_CHANGES_EV_HE : WHAT_CHANGES_EV;

  const example = useMemo(() => scriptedProgression(id, { baseBet: base, percent: 0.02 }, info.example, bankroll, locale), [id, base, info.example, bankroll, locale]);
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
      <PageHeader eyebrow={t("lab.eyebrow")} title={t("lab.title")} description={t("lab.desc")} />

      <Card className="mb-4 border-gold/30">
        <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="size-5 text-gold" /> {t("lab.distTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm text-foreground/85">
            <p>{t("lab.dist1")}</p>
            <p>{t("lab.dist2")}</p>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-muted">{t("lab.whatChanges")}</div>
            <ul className="space-y-1.5 text-sm">
              {changes.map((w) => <li key={w.title}><strong className="text-gold-strong">{w.title}:</strong> <span className="text-foreground/80">{w.body}</span></li>)}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist">
        {STRATEGY_IDS.map((s) => (
          <button key={s} role="tab" aria-selected={s === id} onClick={() => setId(s)}
            className={cn("min-h-10 shrink-0 rounded-full border px-3 py-1.5 text-sm touch-manipulation", s === id ? "border-gold/60 bg-gold/15 text-gold-strong" : "border-border text-muted hover:text-foreground")}>
            {strategyInfo(s, locale).name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{info.name}</CardTitle>
                <Badge variant="muted">{info.familyName}</Badge>
                <Badge variant={RISK_VARIANT[info.risk]}>{t(`risk.${info.risk.replace(" ", "")}` as MessageKey)}</Badge>
                <Badge variant="danger">{t("lab.evBadge")}</Badge>
              </div>
              <CardDescription className="text-base">{info.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal space-y-1.5 ps-5 text-sm text-foreground/85">{info.how.map((h) => <li key={h}>{h}</li>)}</ol>
              <p className="rounded-xl bg-black/30 p-3 text-sm"><strong className="text-gold-strong">{t("lab.really")} </strong>{info.effect}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs uppercase tracking-wide text-good">{t("lab.strengths")}</div>
                  <ul className="space-y-1.5 text-sm">{info.strengths.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" aria-hidden />{s}</li>)}</ul>
                </div>
                <div>
                  <div className="mb-1.5 text-xs uppercase tracking-wide text-danger">{t("lab.weaknesses")}</div>
                  <ul className="space-y-1.5 text-sm">{info.weaknesses.map((s) => <li key={s} className="flex gap-2"><XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />{s}</li>)}</ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("lab.example")}</CardTitle><CardDescription>{t("lab.exampleDesc", { base: fmtMoney(base), bank: fmtMoney(bankroll) })}</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[480px] text-sm tabular-nums">
                  <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                    <tr>{[t("lab.col.spin"), t("lab.col.state"), t("lab.col.stake"), t("lab.col.result"), t("lab.col.net"), t("lab.col.bankroll")].map((h) => <th key={h} className="px-3 py-2 text-start">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {example.map((r) => (
                      <tr key={r.spin} className="border-t border-border/60">
                        <td className="px-3 py-2">{r.spin}</td>
                        <td className="px-3 py-2 text-xs text-muted">{r.state}</td>
                        <td className="px-3 py-2">{fmtMoney(r.stake)}</td>
                        <td className={cn("px-3 py-2 font-semibold", r.result === "W" ? "text-good" : "text-danger")}>{t(r.result === "W" ? "lab.win" : "lab.loss")}</td>
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
            <CardHeader><CardTitle>{t("lab.ladderTitle")}</CardTitle><CardDescription>{t("lab.ladderDesc")}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-sm tabular-nums">
                  <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                    <tr>{[t("lab.col.losses"), t("lab.col.stakeThen"), t("lab.col.totalLost"), t("lab.col.pNow"), t("lab.col.p100")].map((h) => <th key={h} className="px-3 py-2 text-start">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {ladder.map((r) => (
                      <tr key={r.k} className={cn("border-t border-border/60", (r.overMax || r.overBankroll) && "bg-danger/5")}>
                        <td className="px-3 py-1.5">{r.k}</td>
                        <td className={cn("px-3 py-1.5", r.overMax && "text-danger")}>{fmtMoney(r.stake)}{r.overMax && ` ⚠ ${t("lab.overMax")}`}</td>
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
                {firstOverMax ? t("lab.breaksAt", { max: fmtMoney(max), k: firstOverMax.k - 1 }) : t("lab.noBreak", { max: fmtMoney(max) })}{" "}
                {firstBust ? t("lab.bustAt", { bank: fmtMoney(bankroll), k: firstBust.k }) : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t("lab.params")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label={t("lab.base")}><Input type="number" min={1} value={base} onChange={(e) => setBase(Math.max(1, +e.target.value))} /></Field>
              <Field label={t("lab.max")}><Input type="number" min={1} value={max} onChange={(e) => setMax(Math.max(1, +e.target.value))} /></Field>
              <Field label={t("lab.bankroll")}><Input type="number" min={1} value={bankroll} onChange={(e) => setBankroll(Math.max(1, +e.target.value))} /></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("lab.quick")}</CardTitle><CardDescription>{t("lab.quickDesc")}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={runAnalysis} disabled={running}><FlaskConical /> {running ? t("lab.running") : t("lab.run")}</Button>
              <Button variant="ghost" className="w-full" asChild><Link href="/simulator">{t("lab.openSim")}</Link></Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {analysis && analysis.id === id && (
        <Card className="mt-4">
          <CardHeader><CardTitle>{analysis.res.length > 1 ? t("lab.vsFlat", { name: info.name }) : t("lab.flatBaseline")}</CardTitle></CardHeader>
          <CardContent><CompareResults results={analysis.res} /></CardContent>
        </Card>
      )}
    </>
  );
}
