"use client";
import { useEffect, useState } from "react";
import { FlaskConical, Loader2, Square, Target, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CompareResults, DistributionInsight, ProfitHistogram, SamplePaths, SimKpis } from "@/components/sim/sim-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Progress, Select } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimulation } from "@/hooks/use-simulation";
import { strategyInfo } from "@/lib/content/strategies.he";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import type { EvenMoneyRule } from "@/lib/roulette/engine";
import { probReachBefore } from "@/lib/roulette/probability";
import { TARGETS, type SimConfig, type TargetId } from "@/lib/roulette/simulator";
import { STRATEGY_IDS, type StrategyId } from "@/lib/roulette/strategies";
import type { WheelType } from "@/lib/roulette/wheel";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { SERIES } from "@/lib/utils/chart-theme";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/utils/format";

const SPIN_PRESETS = [100, 1000, 10000, 100000];
const SESSION_PRESETS = [1, 100, 1000, 10000];
const MAX_WORK = 50_000_000;
const EXPERIMENT_STRATEGIES: StrategyId[] = ["flat", "martingale", "dalembert", "fibonacci", "paroli"];

export function SimulatorLab() {
  const t = useT();
  const locale = useLocale();
  const settings = useAppStore((s) => s.settings);
  const markExercise = useAppStore((s) => s.markExercise);
  const profile = settings.profile;
  const sim = useSimulation();
  const [mode, setMode] = useState<"single" | "compare" | "experiment">("experiment");
  const [wheel, setWheel] = useState<WheelType>(profile.wheel);
  const [rule, setRule] = useState<EvenMoneyRule>(settings.evenMoneyRule);
  const [bankroll, setBankroll] = useState(profile.bankroll);
  const [baseBet, setBaseBet] = useState(profile.baseBet);
  const [strategy, setStrategy] = useState<StrategyId>("martingale");
  const [target, setTarget] = useState<TargetId>("red");
  const [spins, setSpins] = useState(1000);
  const [sessions, setSessions] = useState(1000);
  const [minBet, setMinBet] = useState(settings.minBet);
  const [maxInside, setMaxInside] = useState(settings.maxInside);
  const [maxOutside, setMaxOutside] = useState(settings.maxOutside);
  const [stopLoss, setStopLoss] = useState(profile.stopLoss);
  const [stopWin, setStopWin] = useState(profile.profitTarget);
  const [percent, setPercent] = useState(2);
  const [onLimit, setOnLimit] = useState<"reset" | "cap">("reset");
  const [seed, setSeed] = useState("training-1");
  const [compare, setCompare] = useState<StrategyId[]>(["flat", "martingale", "dalembert", "fibonacci", "paroli"]);
  const [ranExperiment, setRanExperiment] = useState(false);

  const applyProfile = () => {
    setWheel(profile.wheel); setBankroll(profile.bankroll); setBaseBet(profile.baseBet);
    setStopLoss(profile.stopLoss); setStopWin(profile.profitTarget); setTarget("red");
    setMinBet(settings.minBet); setMaxInside(settings.maxInside); setMaxOutside(settings.maxOutside);
  };

  const expSessions = 10000;
  const expSpins = 5000;
  const work = mode === "experiment" ? expSessions * 300 * EXPERIMENT_STRATEGIES.length : spins * sessions * (mode === "compare" ? compare.length : 1);
  const tooBig = mode !== "experiment" && work > MAX_WORK;

  const buildConfig = (): Omit<SimConfig, "strategy"> => ({
    rules: { wheel, evenMoneyRule: wheel === "european" ? rule : "none", minBet, maxInside, maxOutside },
    params: { baseBet, percent: percent / 100 },
    target, bankroll, spins, sessions,
    stopLoss: stopLoss || undefined,
    stopWin: stopWin || undefined,
    onLimit, seed, recordPaths: 20,
  });

  const run = () => {
    if (tooBig) return;
    if (mode === "single") sim.run({ kind: "single", config: { ...buildConfig(), strategy } });
    else if (mode === "compare") sim.run({ kind: "compare", config: buildConfig(), strategies: compare });
    else {
      setRanExperiment(true);
      sim.run({
        kind: "compare",
        config: { ...buildConfig(), target: "red", bankroll, params: { baseBet }, stopWin, stopLoss, spins: expSpins, sessions: expSessions, seed: `target-${seed}`, recordPaths: 0 },
        strategies: EXPERIMENT_STRATEGIES,
      });
    }
  };

  const isExperimentResult = ranExperiment && mode === "experiment";
  useEffect(() => {
    if (isExperimentResult && sim.status === "done") markExercise("sim-target-experiment");
  }, [isExperimentResult, sim.status, markExercise]);

  const results = sim.results;
  const single = results?.length === 1 ? results[0] : null;
  const exact = wheel === "european" && rule === "none" && baseBet > 0 ? probReachBefore(18 / 37, Math.round(stopWin / baseBet), Math.round(stopLoss / baseBet)) : null;

  return (
    <>
      <PageHeader eyebrow={t("simLab.eyebrow")} title={t("simLab.title")} description={t("simLab.desc")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("simLab.config")}</CardTitle>
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList className="mt-2 w-full">
                <TabsTrigger value="experiment" className="flex-1">{t("simLab.tabExperiment")}</TabsTrigger>
                <TabsTrigger value="single" className="flex-1">{t("simLab.tabSingle")}</TabsTrigger>
                <TabsTrigger value="compare" className="flex-1">{t("simLab.tabCompare")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" size="sm" onClick={applyProfile}><UserRound /> {t("simLab.useProfile", { bank: fmtMoney(profile.bankroll), bet: fmtMoney(profile.baseBet), win: fmtMoney(profile.profitTarget), loss: fmtMoney(profile.stopLoss) })}</Button>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("simLab.wheel")}>
                <Select value={wheel} onChange={(e) => setWheel(e.target.value as WheelType)}>
                  <option value="european">{t("wheel.european")}</option>
                  <option value="american">{t("wheel.american")}</option>
                </Select>
              </Field>
              <Field label={t("simLab.zeroRule")}>
                <Select value={wheel === "european" ? rule : "none"} disabled={wheel !== "european"} onChange={(e) => setRule(e.target.value as EvenMoneyRule)}>
                  <option value="none">{t("rule.none")}</option>
                  <option value="laPartage">La Partage</option>
                  <option value="enPrison">En Prison</option>
                </Select>
              </Field>
              <Field label={t("simLab.bankroll")}><Input type="number" min={1} value={bankroll} onChange={(e) => setBankroll(Math.max(1, +e.target.value))} /></Field>
              <Field label={t("simLab.baseBet")}><Input type="number" min={minBet} value={baseBet} onChange={(e) => setBaseBet(Math.max(minBet, +e.target.value))} /></Field>
              <Field label={t("simLab.stopWin")}><Input type="number" min={0} value={stopWin || ""} placeholder={t("common.none")} onChange={(e) => setStopWin(Math.max(0, +e.target.value))} /></Field>
              <Field label={t("simLab.stopLoss")}><Input type="number" min={0} value={stopLoss || ""} placeholder={t("common.none")} onChange={(e) => setStopLoss(Math.max(0, +e.target.value))} /></Field>
            </div>

            {mode === "experiment" && (
              <p className="rounded-xl bg-gold/10 p-3 text-sm">{t("simLab.experimentQ", { start: fmtMoney(bankroll), bet: fmtMoney(baseBet), up: fmtMoney(bankroll + stopWin), down: fmtMoney(bankroll - stopLoss) })}</p>
            )}
            {mode === "single" && (
              <Field label={t("simLab.strategy")}>
                <Select value={strategy} onChange={(e) => setStrategy(e.target.value as StrategyId)}>
                  {STRATEGY_IDS.map((id) => <option key={id} value={id}>{strategyInfo(id, locale).name}</option>)}
                </Select>
              </Field>
            )}
            {mode === "compare" && (
              <Field label={t("simLab.compareN", { n: compare.length })}>
                <div className="flex flex-wrap gap-1.5">
                  {STRATEGY_IDS.map((id) => {
                    const on = compare.includes(id);
                    return (
                      <button key={id} type="button" onClick={() => setCompare((c) => (on ? c.filter((x) => x !== id) : c.length < 8 ? [...c, id] : c))}
                        className={cn("min-h-9 rounded-full border px-2.5 py-1 text-xs touch-manipulation", on ? "border-gold/60 bg-gold/15 text-gold-strong" : "border-border text-muted")}>
                        {on && <span className="me-1.5 inline-block size-2 rounded-sm" style={{ background: SERIES[compare.indexOf(id)] }} />}
                        {strategyInfo(id, locale).name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
            {mode !== "experiment" && (
              <>
                {(mode === "compare" || strategy !== "mixed") && (
                  <Field label={t("simLab.target")} hint={mode === "compare" ? t("simLab.mixedHint") : undefined}>
                    <Select value={target} onChange={(e) => setTarget(e.target.value as TargetId)}>
                      {TARGETS.map((x) => <option key={x.id} value={x.id}>{t(`target.${x.id}` as MessageKey)}</option>)}
                    </Select>
                  </Field>
                )}
                {(strategy === "percentage" || (mode === "compare" && compare.includes("percentage"))) && (
                  <Field label={t("simLab.percent")}><Input type="number" min={0.5} max={50} step={0.5} value={percent} onChange={(e) => setPercent(+e.target.value)} /></Field>
                )}
                <Field label={t("simLab.spins")}>
                  <div className="flex flex-wrap gap-1.5">
                    {SPIN_PRESETS.map((n) => <Button key={n} size="sm" variant={spins === n ? "outline" : "secondary"} onClick={() => setSpins(n)}>{fmtNum(n)}</Button>)}
                  </div>
                  <Input type="number" min={1} value={spins} onChange={(e) => setSpins(Math.max(1, Math.floor(+e.target.value)))} />
                </Field>
                <Field label={t("simLab.sessions")}>
                  <div className="flex flex-wrap gap-1.5">
                    {SESSION_PRESETS.map((n) => <Button key={n} size="sm" variant={sessions === n ? "outline" : "secondary"} onClick={() => setSessions(n)}>{fmtNum(n)}</Button>)}
                  </div>
                  <Input type="number" min={1} value={sessions} onChange={(e) => setSessions(Math.max(1, Math.floor(+e.target.value)))} />
                </Field>
              </>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Field label={t("simLab.min")}><Input type="number" min={1} value={minBet} onChange={(e) => setMinBet(Math.max(1, +e.target.value))} /></Field>
              <Field label={t("simLab.maxIn")}><Input type="number" min={1} value={maxInside} onChange={(e) => setMaxInside(Math.max(1, +e.target.value))} /></Field>
              <Field label={t("simLab.maxOut")}><Input type="number" min={1} value={maxOutside} onChange={(e) => setMaxOutside(Math.max(1, +e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("simLab.atMax")}>
                <Select value={onLimit} onChange={(e) => setOnLimit(e.target.value as "reset" | "cap")}>
                  <option value="reset">{t("simLab.reset")}</option>
                  <option value="cap">{t("simLab.cap")}</option>
                </Select>
              </Field>
              <Field label={t("simLab.seed")}><Input value={seed} onChange={(e) => setSeed(e.target.value)} /></Field>
            </div>

            {tooBig && <p className="text-xs text-warn">{t("simLab.tooBig", { n: fmtNum(work), max: fmtNum(MAX_WORK) })}</p>}
            {sim.status === "running" ? (
              <div className="space-y-2">
                <Progress value={sim.progress} />
                <Button variant="secondary" className="w-full" onClick={sim.cancel}><Square /> {t("common.cancel")}</Button>
              </div>
            ) : (
              <Button size="lg" className="w-full" onClick={run} disabled={tooBig || (mode === "compare" && compare.length < 2) || (mode === "experiment" && (!stopWin || !stopLoss))}>
                {mode === "experiment" ? <Target /> : <FlaskConical />} {mode === "experiment" ? t("simLab.runExperiment", { n: fmtNum(expSessions) }) : t("simLab.run", { n: fmtNum(work) })}
              </Button>
            )}
            <p className="text-[11px] text-muted">{t("simLab.notPrediction")}</p>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          {sim.status === "error" && <Card><CardContent className="pt-5 text-danger">{sim.error}</CardContent></Card>}
          {!results && sim.status !== "running" && (
            <Card>
              <CardContent className="space-y-3 pt-5 text-sm text-muted">
                <p className="font-display text-lg text-foreground">{t("simLab.howTitle")}</p>
                <ul className="list-disc space-y-1 ps-5">
                  <li>{t("simLab.how1")}</li><li>{t("simLab.how2")}</li><li>{t("simLab.how3")}</li><li>{t("simLab.how4")}</li>
                </ul>
              </CardContent>
            </Card>
          )}
          {sim.status === "running" && (
            <Card><CardContent className="flex items-center gap-3 pt-5 text-muted"><Loader2 className="size-5 animate-spin text-gold" /> {t("simLab.running", { p: Math.round(sim.progress * 100) })}</CardContent></Card>
          )}

          {results && results.length > 1 && isExperimentResult && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t("simLab.expTitle", { up: fmtMoney(results[0].config.bankroll + (results[0].config.stopWin ?? 0)), down: fmtMoney(results[0].config.bankroll - (results[0].config.stopLoss ?? 0)) })}</CardTitle>
                  <CardDescription>{t("simLab.expDesc", { n: fmtNum(results[0].sessions) })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exact !== null && <p className="rounded-xl bg-info/10 p-3 text-sm">{t("simLab.exact", { p: fmtPct(exact, 1), sim: fmtPct(results[0].pStopWin, 1) })}</p>}
                  <CompareResults results={results} showTarget />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t("simLab.fiveTitle")}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(["pProfit", "expected", "bigLoss", "depletion", "volume"] as const).map((k) => (
                    <div key={k} className="rounded-xl border border-border bg-surface-2/50 p-3">
                      <div className="font-medium text-gold-strong">{t(`simLab.five.${k}` as MessageKey)}</div>
                      <p className="mt-1 text-sm text-muted">{t(`simLab.five.${k}.body` as MessageKey, {
                        flat: fmtPct(results[0].pStopWin, 0), mart: fmtPct(results[1].pStopWin, 0),
                        flatAvg: fmtMoney(results[0].meanProfit, { sign: true, decimals: 2 }), martAvg: fmtMoney(results[1].meanProfit, { sign: true, decimals: 2 }),
                        martLoss: fmtMoney(results[1].meanLossOnStop, { decimals: 0 }), flatLoss: fmtMoney(results[0].meanLossOnStop, { decimals: 0 }),
                        flatW: fmtMoney(results[0].meanWagered, { decimals: 0 }), martW: fmtMoney(results[1].meanWagered, { decimals: 0 }),
                      })}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {single && (
            <>
              <Card>
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>{strategyInfo(single.config.strategy, locale).name}</CardTitle>
                    <CardDescription>{t("simLab.singleDesc", { n: fmtNum(single.sessions), spins: fmtNum(single.config.spins) })}</CardDescription>
                  </div>
                  <Badge variant="muted">seed “{String(single.config.seed)}”</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DistributionInsight s={single} />
                  <SimKpis s={single} />
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {single.sessions > 1 && <Card><CardHeader><CardTitle className="text-base">{t("simLab.distribution")}</CardTitle></CardHeader><CardContent><ProfitHistogram s={single} /></CardContent></Card>}
                <Card className={single.sessions === 1 ? "xl:col-span-2" : undefined}><CardHeader><CardTitle className="text-base">{t("simLab.paths")}</CardTitle></CardHeader><CardContent><SamplePaths s={single} /></CardContent></Card>
              </div>
            </>
          )}
          {results && results.length > 1 && !isExperimentResult && (
            <Card>
              <CardHeader><CardTitle>{t("simLab.compareTitle")}</CardTitle><CardDescription>{t("simLab.compareDesc", { n: fmtNum(results[0].sessions), spins: fmtNum(results[0].config.spins) })}</CardDescription></CardHeader>
              <CardContent><CompareResults results={results} /></CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
