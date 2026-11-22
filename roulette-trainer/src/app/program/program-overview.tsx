"use client";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/form";
import { PHASES, PROGRAM } from "@/lib/content/program";
import { computeReadiness } from "@/lib/content/readiness";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { fmtPct } from "@/lib/utils/format";

export function ProgramOverview() {
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const history = useAppStore((s) => s.history);
  const r = computeReadiness(lessonsDone, quizzes, history);
  const nextDay = PROGRAM.find((d) => !lessonsDone[d.day])?.day ?? 14;

  return (
    <>
      <PageHeader eyebrow="Interactive learning program" title="14 days to casino ready" description="Short daily lessons, a hands-on exercise and a quiz. About 15–30 minutes a day, finishing comfortably before your casino visit." />
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span>{r.lessons}/14 lessons · quiz average {fmtPct(r.quizAvg, 0)}</span><span className="text-gold-strong">{r.level}</span></div>
            <Progress value={r.score} />
          </div>
          <Link href={`/program/${nextDay}`} className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-gold-strong to-gold px-5 font-medium text-black">
            Continue: Day {nextDay} <ChevronRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {PHASES.map((phase) => (
          <section key={phase.name}>
            <h2 className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">Days {phase.days[0]}–{phase.days[phase.days.length - 1]} · {phase.name}</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {phase.days.map((d) => {
                const day = PROGRAM[d - 1];
                const done = !!lessonsDone[d];
                const q = quizzes[d === 14 ? "final" : `day-${d}`];
                return (
                  <Link key={d} href={`/program/${d}`} className={cn("group flex items-center gap-3 rounded-2xl border bg-surface/70 p-4 transition-colors hover:border-gold/50", done ? "border-good/30" : d === nextDay ? "border-gold/50" : "border-border")}>
                    {done ? <CheckCircle2 className="size-6 shrink-0 text-good" /> : <Circle className="size-6 shrink-0 text-muted" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted">Day {d}</div>
                      <div className="truncate font-medium">{day.title}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="muted"><Clock className="size-3" /> {day.minutes} min</Badge>
                        {q && <Badge variant={q.best / q.total >= 0.75 ? "good" : "warn"}>Quiz {q.best}/{q.total}</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted group-hover:text-gold" />
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
