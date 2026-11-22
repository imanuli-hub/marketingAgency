"use client";
import { useState } from "react";
import { FlaskConical, Loader2, Square } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CompareResults, DistributionInsight, ProfitHistogram, SamplePaths, SimKpis } from "@/components/sim/sim-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Progress, Select } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimulation } from "@/hooks/use-simulation";
import { STRATEGY_INFO } from "@/lib/content/strategies";
import type { EvenMoneyRule } from "@/lib/roulette/engine";
import { TARGETS, type SimConfig, type TargetId } from "@/lib/roulette/simulator";
import { STRATEGY_IDS, type StrategyId } from "@/lib/roulette/strategies";
import type { WheelType } from "@/lib/roulette/wheel";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { SERIES } from "@/lib/utils/chart-theme";
import { fmtNum } from "@/lib/utils/format";

const SPIN_PRESETS = [100, 1000, 10000, 100000];
const SESSION_PRESETS = [1, 100, 1000, 10000];
const MAX_WORK = 50_000_000;

export function SimulatorLab() {
  const settings = useAppStore((s) => s.settings);
  const sim = useSimulation();
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [wheel, setWheel] = useState<WheelType>(settings.wheel);
  const [rule, setRule] = useState<EvenMoneyRule>(settings.evenMoneyRule);
  const [bankroll, setBankroll] = useState(500);
  const [baseBet, setBaseBet] = useState(5);
  const [strategy, setStrategy] = useState<StrategyId>("martingale");
  const [target, setTarget] = useState<TargetId>("red");
  const [spins, setSpins] = useState(1000);
  const [sessions, setSessions] = useState(1000);
  const [minBet, setMinBet] = useState(settings.minBet);
  const [maxInside, setMaxInside] = useState(settings.maxInside);
  const [maxOutside, setMaxOutside] = useState(settings.maxOutside);
  const [stopLoss, setStopLoss] = useState(0);
  const [stopWin, setStopWin] = useState(0);
  const [percent, setPercent] = useState(2);
  const [onLimit, setOnLimit] = useState<"reset" | "cap">("reset");
  const [seed, setSeed] = useState("training-1");
  const [compare, setCompare] = useState<StrategyId[]>(["flat", "martingale", "dalembert", "fibonacci", "paroli"]);

  const work = spins * sessions * (mode === "compare" ? compare.length : 1);
  const tooBig = work > MAX_WORK;

  const buildConfig = (): Omit<SimConfig, "strategy"> => ({
    rules: { wheel, evenMoneyRule: wheel === "european" ? rule : "none", minBet, maxInside, maxOutside },
    params: { baseBet, percent: percent / 100 },
    target,
    bankroll,
    spins,
    sessions,
    stopLoss: stopLoss || undefined,
    stopWin: stopWin || undefined,
    onLimit,
    seed,
    recordPaths: 20,
  });

  const run = () => {
    if (tooBig) return;
    if (mode === "single") sim.run({ kind: "single", config: { ...buildConfig(), strategy } });
    else sim.run({ kind: "compare", config: buildConfig(), strategies: compare });
  };

  const results = sim.results;
  const single = results?.length === 1 ? results[0] : null;

  return (
    <>
      <PageHeader
        eyebrow="Monte Carlo laboratory"
        title="Strategy Simulator"
        description="Run thousands of independent virtual sessions to see the full range of outcomes a betting approach produces. The same seed always produces the same spins, and comparisons use identical spin sequences for every strategy."
      />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "compare")}>
              <TabsList className="mt-2 w-full">
                <TabsTrigger value="single" className="flex-1">Single strategy</TabsTrigger>
                <TabsTrigger value="compare" className="flex-1">Compare</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Roulette type">
                <Select value={wheel} onChange={(e) => setWheel(e.target.value as WheelType)}>
                  <option value="european">European (0)</option>
                  <option value="american">American (0, 00)</option>
                </Select>
              </Field>
              <Field label="Zero rule">
                <Select value={wheel === "european" ? rule : "none"} disabled={wheel !== "european"} onChange={(e) => setRule(e.target.value as EvenMoneyRule)}>
                  <option value="none">Standard</option>
                  <option value="laPartage">La Partage</option>
                  <option value="enPrison">En Prison</option>
                </Select>
              </Field>
              <Field label="Starting bankroll"><Input type="number" min={1} value={bankroll} onChange={(e) => setBankroll(Math.max(1, +e.target.value))} /></Field>
              <Field label="Base bet"><Input type="number" min={minBet} value={baseBet} onChange={(e) => setBaseBet(Math.max(minBet, +e.target.value))} /></Field>
            </div>

            {mode === "single" ? (
              <Field label="Strategy">
                <Select value={strategy} onChange={(e) => setStrategy(e.target.value as StrategyId)}>
                  {STRATEGY_IDS.map((id) => <option key={id} value={id}>{STRATEGY_INFO[id].name}</option>)}
                </Select>
              </Field>
            ) : (
              <Field label={`Strategies to compare (${compare.length}/8)`}>
                <div className="flex flex-wrap gap-1.5">
                  {STRATEGY_IDS.map((id) => {
                    const on = compare.includes(id);
                    return (
                      <button key={id} type="button" onClick={() => setCompare((c) => (on ? c.filter((x) => x !== id) : c.length < 8 ? [...c, id] : c))}
                        className={cn("rounded-full border px-2.5 py-1 text-xs touch-manipulation", on ? "border-gold/60 bg-gold/15 text-gold-strong" : "border-border text-muted")}>
                        {on && <span className="mr-1.5 inline-block size-2 rounded-sm" style={{ background: SERIES[compare.indexOf(id)] }} />}
                        {STRATEGY_INFO[id].name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
            {(mode === "compare" || strategy !== "mixed") && (
              <Field label="Bet played" hint={mode === "compare" ? "Mixed inside/outside always uses its own layout." : undefined}>
                <Select value={target} onChange={(e) => setTarget(e.target.value as TargetId)}>
                  {TARGETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </Select>
              </Field>
            )}
            {(strategy === "percentage" || (mode === "compare" && compare.includes("percentage"))) && (
              <Field label="Percentage of bankroll"><Input type="number" min={0.5} max={50} step={0.5} value={percent} onChange={(e) => setPercent(+e.target.value)} /></Field>
            )}

            <Field label="Spins per session">
              <div className="flex flex-wrap gap-1.5">
                {SPIN_PRESETS.map((n) => <Button key={n} size="sm" variant={spins === n ? "outline" : "secondary"} onClick={() => setSpins(n)}>{fmtNum(n)}</Button>)}
              </div>
              <Input type="number" min={1} value={spins} onChange={(e) => setSpins(Math.max(1, Math.floor(+e.target.value)))} />
            </Field>
            <Field label="Independent sessions">
              <div className="flex flex-wrap gap-1.5">
                {SESSION_PRESETS.map((n) => <Button key={n} size="sm" variant={sessions === n ? "outline" : "secondary"} onClick={() => setSessions(n)}>{fmtNum(n)}</Button>)}
              </div>
              <Input type="number" min={1} value={sessions} onChange={(e) => setSessions(Math.max(1, Math.floor(+e.target.value)))} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Table min"><Input type="number" min={1} value={minBet} onChange={(e) => setMinBet(Math.max(1, +e.target.value))} /></Field>
              <Field label="Max inside"><Input type="number" min={1} value={maxInside} onChange={(e) => setMaxInside(Math.max(1, +e.target.value))} /></Field>
              <Field label="Max outside"><Input type="number" min={1} value={maxOutside} onChange={(e) => setMaxOutside(Math.max(1, +e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stop-loss ($)"><Input type="number" min={0} value={stopLoss || ""} placeholder="none" onChange={(e) => setStopLoss(Math.max(0, +e.target.value))} /></Field>
              <Field label="Stop-win ($)"><Input type="number" min={0} value={stopWin || ""} placeholder="none" onChange={(e) => setStopWin(Math.max(0, +e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="At table max">
                <Select value={onLimit} onChange={(e) => setOnLimit(e.target.value as "reset" | "cap")}>
                  <option value="reset">Reset progression</option>
                  <option value="cap">Bet the maximum</option>
                </Select>
              </Field>
              <Field label="Random seed"><Input value={seed} onChange={(e) => setSeed(e.target.value)} /></Field>
            </div>

            {tooBig && <p className="text-xs text-warn">That&apos;s {fmtNum(work)} spins — please keep runs under {fmtNum(MAX_WORK)}.</p>}
            {sim.status === "running" ? (
              <div className="space-y-2">
                <Progress value={sim.progress} />
                <Button variant="secondary" className="w-full" onClick={sim.cancel}><Square /> Cancel</Button>
              </div>
            ) : (
              <Button size="lg" className="w-full" onClick={run} disabled={tooBig || (mode === "compare" && compare.length < 2)}>
                <FlaskConical /> Run {fmtNum(work)} spins
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          {sim.status === "error" && <Card><CardContent className="pt-5 text-danger">{sim.error}</CardContent></Card>}
          {!results && sim.status !== "running" && (
            <Card>
              <CardContent className="space-y-3 pt-5 text-sm text-muted">
                <p className="font-display text-lg text-foreground">How to use the lab</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Try Martingale with 1,000 sessions of 200 spins: notice how often it finishes ahead — and how badly the rest lose.</li>
                  <li>Switch to <em>Compare</em> to run several systems against the exact same spins.</li>
                  <li>Run Flat betting for 1 session of 100,000 spins and watch the actual loss approach the theoretical house edge.</li>
                  <li>Compare European vs American and La Partage — the only settings that actually change the expected loss rate.</li>
                </ul>
              </CardContent>
            </Card>
          )}
          {sim.status === "running" && (
            <Card><CardContent className="flex items-center gap-3 pt-5 text-muted"><Loader2 className="size-5 animate-spin text-gold" /> Simulating… {Math.round(sim.progress * 100)}%</CardContent></Card>
          )}
          {single && (
            <>
              <Card>
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>{STRATEGY_INFO[single.config.strategy].name}</CardTitle>
                    <CardDescription>{fmtNum(single.sessions)} sessions × up to {fmtNum(single.config.spins)} spins · {single.config.rules.wheel === "european" ? "European" : "American"}</CardDescription>
                  </div>
                  <Badge variant="muted">seed “{String(single.config.seed)}”</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DistributionInsight s={single} />
                  <SimKpis s={single} />
                </CardContent>
              </Card>
              <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                {single.sessions > 1 && (
                  <Card><CardHeader><CardTitle className="text-base">Profit / loss distribution</CardTitle></CardHeader><CardContent><ProfitHistogram s={single} /></CardContent></Card>
                )}
                <Card className={single.sessions === 1 ? "xl:col-span-2" : undefined}><CardHeader><CardTitle className="text-base">Bankroll paths</CardTitle></CardHeader><CardContent><SamplePaths s={single} /></CardContent></Card>
              </div>
            </>
          )}
          {results && results.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Strategy comparison</CardTitle><CardDescription>{fmtNum(results[0].sessions)} sessions × up to {fmtNum(results[0].config.spins)} spins each, identical spins for every strategy.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <CompareResults results={results} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
