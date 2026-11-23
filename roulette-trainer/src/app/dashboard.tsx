"use client";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CalendarCheck, CheckCircle2, Dices, Flag, GraduationCap, Info, Landmark } from "lucide-react";
import { ProfileEditor, ProfileSummary } from "@/components/training/profile-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Stat } from "@/components/ui/form";
import { cumulativeSeries, sessionNet, totals } from "@/lib/analytics/aggregate";
import { getProgram } from "@/lib/content/program";
import { strategyInfo } from "@/lib/content/strategies.he";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { currentDay, milestones } from "@/lib/training/program-state";
import { readinessReport } from "@/lib/training/readiness";
import { useAppStore } from "@/store/app-store";
import { AXIS, GRID, SERIES, TOOLTIP_STYLE } from "@/lib/utils/chart-theme";
import { fmtDate, fmtMoney, fmtPct } from "@/lib/utils/format";

export function Dashboard() {
  const t = useT();
  const locale = useLocale();
  const bankroll = useAppStore((s) => s.bankroll);
  const history = useAppStore((s) => s.history);
  const current = useAppStore((s) => s.current);
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const exercisesDone = useAppStore((s) => s.exercisesDone);
  const strategy = useAppStore((s) => s.settings.practiceStrategy ?? s.settings.profile.strategy);

  // Analytics cover real practice and rehearsals; the guided tutorial wallet is excluded.
  const played = [...history, ...[current.practice, current.casino].filter((s) => !!s)].filter((s) => s!.mode !== "guided") as typeof history;
  const tot = totals(played);
  const series = cumulativeSeries(played);
  const day = currentDay(lessonsDone, quizzes);
  const lesson = getProgram(locale)[day - 1];
  const ms = milestones(lessonsDone, quizzes, history, exercisesDone);
  const r = readinessReport(lessonsDone, quizzes, history);
  const practiceSessions = played.filter((s) => s.mode === "practice" && s.endedAt).length;
  const last = [...played].filter((s) => s.spinCount > 0).sort((a, b) => b.startedAt - a.startedAt)[0];
  const avgResult = tot.sessions ? tot.net / tot.sessions : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-felt-dark via-surface to-background p-5 sm:p-8">
        <div className="absolute -end-16 -top-16 size-64 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <Badge>{t("dash.trainingDay", { day, total: 14 })}</Badge>
            <h1 className="mt-3 font-display text-2xl sm:text-4xl"><span className="gold-text">{lesson.title}</span></h1>
            <p className="mt-2 text-sm text-muted">{lesson.phase}</p>
            <div className="mt-4 flex gap-2 rounded-xl border border-border bg-black/30 p-3 text-sm">
              <Flag className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <div><div className="text-[11px] uppercase tracking-wide text-muted">{t("dash.todayObjective")}</div><p className="mt-0.5">{lesson.objective}</p></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="lg" asChild><Link href={`/program/${day}`}><CalendarCheck /> {t("dash.continue")}</Link></Button>
              <Button variant="secondary" asChild><Link href="/play"><Dices /> {t("nav.play")}</Link></Button>
              <Button variant="ghost" asChild><Link href="/guided"><GraduationCap /> {t("nav.guided")}</Link></Button>
              <Button variant="ghost" asChild><Link href="/casino/session"><Landmark /> {t("assess.rehearsal")}</Link></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-black/30 p-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted">{t("dash.readiness")}</span><span className="text-gold-strong">{t(`level.${r.level}` as MessageKey)}</span></div>
            <div className="mt-2 text-4xl font-semibold tabular-nums">{fmtPct(r.score, 0)}</div>
            <Progress value={r.score} className="mt-3" />
            <ul className="mt-3 space-y-2 text-xs">
              {ms.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  {m.done >= m.target ? <CheckCircle2 className="size-4 shrink-0 text-good" aria-hidden /> : <span className="grid size-4 shrink-0 place-items-center rounded-full border border-border text-[9px] text-muted">{m.done}</span>}
                  <span className="flex-1">{t(`milestone.${m.id}` as MessageKey)}</span>
                  <span className="tabular-nums text-muted">{m.done}/{m.target}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <div><CardTitle>{t("dash.profile")}</CardTitle><CardDescription>{t("dash.profileDesc")}</CardDescription></div>
          <ProfileEditor />
        </CardHeader>
        <CardContent><ProfileSummary compact /></CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-xl">{t("dash.performance")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t("dash.bankroll")} value={fmtMoney(bankroll)} tone="gold" />
          <Stat label={t("dash.sessions")} value={practiceSessions} sub={t("dash.sessionsSub", { all: tot.sessions, spins: tot.spins })} />
          <Stat label={t("dash.lastSession")} value={last ? fmtMoney(sessionNet(last), { sign: true }) : "—"} tone={last ? (sessionNet(last) > 0 ? "good" : sessionNet(last) < 0 ? "danger" : undefined) : undefined} sub={last ? fmtDate(last.startedAt) : undefined} />
          <Stat label={t("dash.wagered")} value={fmtMoney(tot.wagered, { decimals: 0 })} sub={t("dash.avgStake", { amount: fmtMoney(tot.avgStake, { decimals: 2 }) })} />
          <Stat label={t("dash.avgResult")} value={tot.sessions ? fmtMoney(avgResult, { sign: true, decimals: 2 }) : "—"} sub={t("dash.returnOnWagers", { pct: tot.wagered ? fmtPct(tot.returnOnWagers, 2) : "—" })} />
          <Stat label={t("dash.strategy")} value={<span className="text-base">{strategyInfo(strategy, locale).name}</span>} />
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <p className="flex gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-sm text-foreground/80">
            <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />{t("dash.freqNote", { spins: fmtPct(tot.winningSpinRate), sessions: fmtPct(tot.winningSessionRate) })}
          </p>
          <p className="flex gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-sm text-foreground/80">
            <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />{t("dash.luckNote", { expected: fmtMoney(-tot.theoreticalLoss, { sign: true, decimals: 2 }), luck: fmtMoney(tot.net + tot.theoreticalLoss, { sign: true, decimals: 2 }) })}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader><CardTitle>{t("dash.chartTitle")}</CardTitle><CardDescription>{t("dash.chartDesc")}</CardDescription></CardHeader>
          <CardContent>
            {series.length < 2 ? (
              <p className="py-10 text-center text-sm text-muted">{t("dash.chartEmpty")} <Link className="text-gold underline" href="/play">{t("nav.play")}</Link></p>
            ) : (
              <div dir="ltr">
                <div className="mb-2 flex gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: SERIES[0] }} /> {t("dash.actual")}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: SERIES[1] }} /> {t("dash.expected")}</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="n" {...AXIS} tickFormatter={(v: number) => `#${v}`} minTickGap={20} />
                    <YAxis {...AXIS} width={56} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} />
                    <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => t("dash.afterSession", { n: String(v) })} formatter={(v) => fmtMoney(Number(v), { sign: true })} />
                    <ReferenceLine y={0} stroke="#3a4d43" />
                    <Line dataKey="actual" name={t("dash.actual")} stroke={SERIES[0]} strokeWidth={2} dot={series.length < 30 ? { r: 4, strokeWidth: 2, stroke: "#0d1a14" } : false} isAnimationActive={false} />
                    <Line dataKey="expected" name={t("dash.expected")} stroke={SERIES[1]} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>{t("dash.recent")}</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/history">{t("dash.all")} <ArrowRight className="rtl:-scale-x-100" /></Link></Button></CardHeader>
          <CardContent className="space-y-1.5">
            {played.length === 0 && <p className="text-sm text-muted">{t("dash.noSessions")}</p>}
            {[...played].sort((a, b) => b.startedAt - a.startedAt).slice(0, 6).map((s) => {
              const n = sessionNet(s);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 px-3 py-2 text-sm">
                  <Badge variant={s.mode === "casino" ? "default" : "muted"}>{t(`mode.${s.mode}` as MessageKey)}</Badge>
                  <span className="min-w-0 flex-1 truncate text-muted">{fmtDate(s.startedAt)} · {t("practice.spins", { n: s.spinCount })}{!s.endedAt && ` · ${t("history.inProgress")}`}</span>
                  <span className={`tabular-nums ${n > 0 ? "text-good" : n < 0 ? "text-danger" : ""}`}>{fmtMoney(n, { sign: true })}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
