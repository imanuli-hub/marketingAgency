"use client";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { ArrowRight, CalendarCheck, Dices, FlaskConical, Info, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Stat } from "@/components/ui/form";
import { byStrategy, cumulativeSeries, sessionNet, totals } from "@/lib/analytics/aggregate";
import { PROGRAM } from "@/lib/content/program";
import { computeReadiness } from "@/lib/content/readiness";
import { STRATEGY_INFO } from "@/lib/content/strategies";
import type { StrategyId } from "@/lib/roulette/strategies";
import { useAppStore } from "@/store/app-store";
import { AXIS, GRID, SERIES, TOOLTIP_STYLE } from "@/lib/utils/chart-theme";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/utils/format";

const strategyName = (k: string) => (k in STRATEGY_INFO ? STRATEGY_INFO[k as StrategyId].name : k);

export function Dashboard() {
  const bankroll = useAppStore((s) => s.bankroll);
  const history = useAppStore((s) => s.history);
  const current = useAppStore((s) => s.current);
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const all = [...history, ...Object.values(current).filter((s) => !!s)];
  const t = totals(all);
  const series = cumulativeSeries(all);
  const strategies = byStrategy(all);
  const readiness = computeReadiness(lessonsDone, quizzes, history);
  const nextDay = PROGRAM.find((d) => !lessonsDone[d.day]);
  const luck = t.net + t.theoreticalLoss;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-felt-dark via-surface to-background p-5 sm:p-8">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <Badge>Virtual money only</Badge>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl"><span className="gold-text">Train like a pro.</span> Play like you have a plan.</h1>
            <p className="mt-3 max-w-xl text-sm text-foreground/75">Learn every bet, understand the real maths, test strategies against thousands of simulated sessions, and rehearse a casino visit with fixed budgets and stopping rules. No system beats the house edge — this app shows you exactly why, and how to enjoy the game anyway.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild><Link href={nextDay ? `/program/${nextDay.day}` : "/program"}><CalendarCheck /> {nextDay ? `Day ${nextDay.day}: ${nextDay.title}` : "Review program"}</Link></Button>
              <Button variant="secondary" asChild><Link href="/play"><Dices /> Practice table</Link></Button>
              <Button variant="ghost" asChild><Link href="/casino/session"><Landmark /> Casino rehearsal</Link></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-black/30 p-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted">Casino readiness</span><span className="text-gold-strong">{readiness.level}</span></div>
            <div className="mt-2 text-4xl font-semibold tabular-nums">{fmtPct(readiness.score, 0)}</div>
            <Progress value={readiness.score} className="mt-3" />
            <ul className="mt-3 space-y-1 text-xs text-muted">
              <li>Lessons: {readiness.lessons}/14</li>
              <li>Quiz average: {fmtPct(readiness.quizAvg, 0)}</li>
              <li>Final assessment: {readiness.finalScore != null ? fmtPct(readiness.finalScore, 0) : "not taken"}</li>
              <li>Casino rehearsals on plan: {readiness.onPlanSessions}/3</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Training performance</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Virtual bankroll" value={fmtMoney(bankroll)} tone="gold" />
          <Stat label="Sessions" value={fmtNum(t.sessions)} sub={`${fmtNum(t.spins)} spins`} />
          <Stat label="Total wagered" value={fmtMoney(t.wagered, { decimals: 0 })} sub={`avg stake ${fmtMoney(t.avgStake, { decimals: 2 })}`} />
          <Stat label="Net profit / loss" value={fmtMoney(t.net, { sign: true })} tone={t.net > 0 ? "good" : t.net < 0 ? "danger" : undefined} />
          <Stat label="Return on wagers" value={t.wagered ? fmtPct(t.returnOnWagers, 2) : "—"} sub={`house edge ${t.wagered ? fmtPct(-t.theoreticalLoss / t.wagered, 2) : "—"}`} />
          <Stat label="Largest drawdown" value={fmtMoney(t.largestDrawdown, { decimals: 0 })} sub={`biggest stake ${fmtMoney(t.biggestStake, { decimals: 0 })}`} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="flex gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p className="text-foreground/80">Winning spins: <strong>{fmtPct(t.winningSpinRate)}</strong> · winning sessions: <strong>{fmtPct(t.winningSessionRate)}</strong>. Win <em>frequency</em> is not profitability — return on wagers ({t.wagered ? fmtPct(t.returnOnWagers, 2) : "—"}) is what counts.</p>
          </div>
          <div className="flex gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p className="text-foreground/80">Expected result from the house edge: <strong>{fmtMoney(-t.theoreticalLoss, { sign: true })}</strong>. Your actual result differs by <strong>{fmtMoney(luck, { sign: true })}</strong> — that difference is variance (luck), not skill.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader><CardTitle>Cumulative result vs expectation</CardTitle><CardDescription>Across all sessions, oldest to newest.</CardDescription></CardHeader>
          <CardContent>
            {series.length < 2 ? (
              <p className="py-10 text-center text-sm text-muted">Play at least two sessions to see your trend. <Link className="text-gold underline" href="/play">Start practising</Link></p>
            ) : (
              <>
                <div className="mb-2 flex gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: SERIES[0] }} /> Actual</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: SERIES[1] }} /> Expected (house edge)</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="n" {...AXIS} tickFormatter={(v: number) => `#${v}`} minTickGap={20} />
                    <YAxis {...AXIS} width={56} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} />
                    <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => `After session ${v}`} formatter={(v) => fmtMoney(Number(v), { sign: true })} />
                    <ReferenceLine y={0} stroke="#3a4d43" />
                    <Line dataKey="actual" name="Actual" stroke={SERIES[0]} strokeWidth={2} dot={series.length < 30 ? { r: 4, strokeWidth: 2, stroke: "#0d1a14" } : false} isAnimationActive={false} />
                    <Line dataKey="expected" name="Expected" stroke={SERIES[1]} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Learning progress</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {PROGRAM.map((d) => {
              const q = quizzes[d.day === 14 ? "final" : `day-${d.day}`];
              return (
                <Link key={d.day} href={`/program/${d.day}`} className="flex items-center gap-2 text-sm hover:text-gold-strong">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] ${lessonsDone[d.day] ? "bg-good/20 text-good" : "bg-white/5 text-muted"}`}>{d.day}</span>
                  <span className="min-w-0 flex-1 truncate">{d.title}</span>
                  {q && <span className="text-xs tabular-nums text-muted">{q.best}/{q.total}</span>}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Strategy performance</CardTitle><CardDescription>Your sessions grouped by the strategy you followed.</CardDescription></CardHeader>
          <CardContent>
            {strategies.length === 0 ? <p className="text-sm text-muted">No sessions yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm tabular-nums">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="py-1.5">Approach</th><th>Sessions</th><th>Wagered</th><th>Net</th><th>Return</th></tr></thead>
                  <tbody>
                    {strategies.map((s) => (
                      <tr key={s.key} className="border-t border-border/60">
                        <td className="py-1.5">{strategyName(s.key)}</td>
                        <td>{s.sessions}</td>
                        <td>{fmtMoney(s.wagered, { decimals: 0 })}</td>
                        <td className={s.net >= 0 ? "text-good" : "text-danger"}>{fmtMoney(s.net, { sign: true })}</td>
                        <td>{fmtPct(s.returnOnWagers, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted">Small samples are dominated by luck. Use the Simulator to judge a strategy over thousands of sessions.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Recent sessions</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/history">All <ArrowRight /></Link></Button></CardHeader>
          <CardContent className="space-y-1.5">
            {all.length === 0 && <p className="text-sm text-muted">Your sessions will appear here.</p>}
            {[...all].sort((a, b) => b.startedAt - a.startedAt).slice(0, 6).map((s) => {
              const n = sessionNet(s);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 px-3 py-2 text-sm">
                  <Badge variant={s.mode === "casino" ? "default" : "muted"}>{s.mode === "casino" ? "Casino" : "Practice"}</Badge>
                  <span className="min-w-0 flex-1 truncate text-muted">{new Date(s.startedAt).toLocaleDateString()} · {s.spinCount} spins{!s.endedAt && " · in progress"}</span>
                  <span className={`tabular-nums ${n > 0 ? "text-good" : n < 0 ? "text-danger" : ""}`}>{fmtMoney(n, { sign: true })}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
          <FlaskConical className="size-8 shrink-0 text-gold" />
          <p className="flex-1 text-sm text-foreground/80">Curious whether a system “works”? Run it for 10,000 simulated sessions and look at the average result and the worst 5% — not just how often it wins.</p>
          <Button variant="outline" asChild><Link href="/simulator">Open the Simulator</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
