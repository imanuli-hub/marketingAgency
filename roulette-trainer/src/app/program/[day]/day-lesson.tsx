"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell, Target } from "lucide-react";
import { Quiz } from "@/components/learn/quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FINAL_ASSESSMENT, PROGRAM } from "@/lib/content/program";
import { computeReadiness } from "@/lib/content/readiness";
import { useAppStore } from "@/store/app-store";
import { fmtPct } from "@/lib/utils/format";

export function LessonSections({ sections }: { sections: { heading: string; body?: string[]; bullets?: string[] }[] }) {
  return (
    <div className="prose-casino">
      {sections.map((s) => (
        <section key={s.heading}>
          <h3>{s.heading}</h3>
          {s.body?.map((p) => <p key={p}>{p}</p>)}
          {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        </section>
      ))}
    </div>
  );
}

export function DayLesson({ day }: { day: number }) {
  const d = PROGRAM[day - 1];
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const exercisesDone = useAppStore((s) => s.exercisesDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const history = useAppStore((s) => s.history);
  const markLesson = useAppStore((s) => s.markLesson);
  const markExercise = useAppStore((s) => s.markExercise);
  const done = !!lessonsDone[day];
  const isFinal = day === 14;
  const readiness = computeReadiness(lessonsDone, quizzes, history);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <Link href="/program" className="inline-flex items-center gap-1 text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Program</Link>
        <span className="text-muted">{d.phase}</span>
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Day {day} of 14</div>
        <h1 className="mt-1 font-display text-3xl">{d.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">{d.goals.map((g) => <Badge key={g} variant="muted"><Target className="size-3" /> {g}</Badge>)}</div>
      </div>

      <Card><CardContent className="pt-2"><LessonSections sections={d.sections} /></CardContent></Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Dumbbell className="size-5 text-gold" /> Exercise: {d.exercise.title}</CardTitle>
          <CardDescription>{d.exercise.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={d.exercise.href}>{d.exercise.cta}</Link></Button>
          <Button variant={exercisesDone[d.exercise.id] ? "secondary" : "ghost"} onClick={() => markExercise(d.exercise.id)} disabled={!!exercisesDone[d.exercise.id]}>
            {exercisesDone[d.exercise.id] ? <><CheckCircle2 className="text-good" /> Exercise done</> : "Mark exercise done"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isFinal ? "Casino readiness assessment" : "Quiz"}</CardTitle>
          <CardDescription>{isFinal ? "12 questions across everything you've learned. 80% or more means you're ready." : "Instant feedback with explanations. 75% to pass."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Quiz id={isFinal ? "final" : `day-${day}`} questions={isFinal ? FINAL_ASSESSMENT : d.quiz} passMark={isFinal ? 0.8 : 0.75} />
        </CardContent>
      </Card>

      {isFinal && (
        <Card className="border-gold/40">
          <CardHeader><CardTitle>Overall readiness: {fmtPct(readiness.score, 0)} — {readiness.level}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted">
            Lessons {readiness.lessons}/14 · quiz average {fmtPct(readiness.quizAvg, 0)} · final assessment {readiness.finalScore != null ? fmtPct(readiness.finalScore, 0) : "not taken"} · casino rehearsals completed on plan: {readiness.onPlanSessions}/3.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <Button onClick={() => markLesson(day)} disabled={done} variant={done ? "secondary" : "default"}>
          {done ? <><CheckCircle2 className="text-good" /> Lesson complete</> : "Mark lesson complete"}
        </Button>
        <div className="flex gap-2">
          {day > 1 && <Button variant="ghost" asChild><Link href={`/program/${day - 1}`}><ArrowLeft /> Day {day - 1}</Link></Button>}
          {day < 14 && <Button variant="outline" asChild><Link href={`/program/${day + 1}`}>Day {day + 1} <ArrowRight /></Link></Button>}
        </div>
      </div>
    </div>
  );
}
