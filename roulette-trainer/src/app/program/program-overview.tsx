"use client";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/form";
import { getPhases, getProgram } from "@/lib/content/program";
import { useLocale, useT } from "@/lib/i18n";
import { currentDay, dayComplete } from "@/lib/training/program-state";
import { readinessReport } from "@/lib/training/readiness";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { fmtPct } from "@/lib/utils/format";

export function ProgramOverview() {
  const t = useT();
  const locale = useLocale();
  const program = getProgram(locale);
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const history = useAppStore((s) => s.history);
  const r = readinessReport(lessonsDone, quizzes, history);
  const next = currentDay(lessonsDone, quizzes);

  return (
    <>
      <PageHeader eyebrow={t("program.eyebrow")} title={t("program.title")} description={t("program.desc")} />
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{t("program.summary", { done: Math.round(r.programCompletion * 14), total: 14 })}</span>
              <span className="text-gold-strong">{t(`level.${r.level}`)} · {fmtPct(r.score, 0)}</span>
            </div>
            <Progress value={r.programCompletion} />
          </div>
          <Link href={`/program/${next}`} className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-gold-strong to-gold px-5 font-medium text-black">
            {t("program.continue", { day: next })} <ChevronRight className="size-4 rtl:-scale-x-100" />
          </Link>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {getPhases(locale).map((phase) => (
          <section key={phase.name}>
            <h2 className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">{t("program.phaseDays", { from: phase.days[0], to: phase.days[phase.days.length - 1] })} · {phase.name}</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {phase.days.map((d) => {
                const day = program[d - 1];
                const complete = dayComplete(d, lessonsDone, quizzes);
                const q = quizzes[`day-${d}`];
                return (
                  <Link key={d} href={`/program/${d}`} className={cn("group flex items-center gap-3 rounded-2xl border bg-surface/70 p-4 transition-colors hover:border-gold/50", complete ? "border-good/30" : d === next ? "border-gold/50" : "border-border")}>
                    {complete ? <CheckCircle2 className="size-6 shrink-0 text-good" aria-label={t("program.complete")} /> : <Circle className="size-6 shrink-0 text-muted" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted">{t("program.day", { day: d })}</div>
                      <div className="truncate font-medium">{day.title}</div>
                      <div className="mt-1 text-xs text-muted">{day.objective}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant="muted"><Clock className="size-3" /> {t("program.minutes", { n: day.minutes })}</Badge>
                        {lessonsDone[d] && <Badge variant="info">{t("program.lessonRead")}</Badge>}
                        {q && <Badge variant={q.best / q.total >= 0.75 ? "good" : "warn"}>{t("program.quiz", { best: q.best, total: q.total })}</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted group-hover:text-gold rtl:-scale-x-100" aria-hidden />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
