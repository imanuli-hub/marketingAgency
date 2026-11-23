"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Dumbbell, Flag, Target } from "lucide-react";
import { Quiz } from "@/components/learn/quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgram, type LessonSection } from "@/lib/content/program";
import { useLocale, useT } from "@/lib/i18n";
import { dayComplete } from "@/lib/training/program-state";
import { useAppStore } from "@/store/app-store";

export function LessonSections({ sections }: { sections: LessonSection[] }) {
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
  const t = useT();
  const locale = useLocale();
  const d = getProgram(locale)[day - 1];
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const exercisesDone = useAppStore((s) => s.exercisesDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const markLesson = useAppStore((s) => s.markLesson);
  const markExercise = useAppStore((s) => s.markExercise);
  const read = !!lessonsDone[day];
  const complete = dayComplete(day, lessonsDone, quizzes);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <Link href="/program" className="inline-flex min-h-10 items-center gap-1 text-muted hover:text-foreground"><ArrowLeft className="size-4 rtl:-scale-x-100" /> {t("program.back")}</Link>
        <span className="text-muted">{d.phase}</span>
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-gold">{t("program.dayOf", { day })}</div>
        <h1 className="mt-1 font-display text-3xl">{d.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">{d.goals.map((g) => <Badge key={g} variant="muted"><Target className="size-3" /> {g}</Badge>)}</div>
        {complete && <Badge variant="good" className="mt-2"><CheckCircle2 className="size-3" /> {t("program.complete")}</Badge>}
      </div>

      <Card className="border-gold/40">
        <CardContent className="flex gap-3 pt-5">
          <Flag className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <div><div className="text-xs uppercase tracking-wide text-muted">{t("program.objective")}</div><p className="mt-1">{d.objective}</p></div>
        </CardContent>
      </Card>

      <Card><CardContent className="pt-2"><LessonSections sections={d.sections} /></CardContent></Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Dumbbell className="size-5 text-gold" /> {t("program.exercise")}: {d.exercise.title}</CardTitle>
          <CardDescription>{d.exercise.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={d.exercise.href}>{d.exercise.cta}</Link></Button>
          <Button variant={exercisesDone[d.exercise.id] ? "secondary" : "ghost"} onClick={() => markExercise(d.exercise.id)} disabled={!!exercisesDone[d.exercise.id]}>
            {exercisesDone[d.exercise.id] ? <><CheckCircle2 className="text-good" /> {t("program.exerciseDone")}</> : t("program.markExercise")}
          </Button>
        </CardContent>
      </Card>

      {d.quiz.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>{t("program.quizTitle")}</CardTitle><CardDescription>{t("program.quizDesc")}</CardDescription></CardHeader>
          <CardContent><Quiz id={`day-${day}`} questions={d.quiz} /></CardContent>
        </Card>
      ) : (
        <Card className="border-gold/40">
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <ClipboardCheck className="size-6 text-gold" aria-hidden />
            <p className="flex-1">{t("program.assessmentCta")}</p>
            <Button asChild><Link href="/assessment">{t("nav.assessment")}</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <Button onClick={() => markLesson(day)} disabled={read} variant={read ? "secondary" : "default"}>
          {read ? <><CheckCircle2 className="text-good" /> {t("program.lessonRead")}</> : t("program.markLesson")}
        </Button>
        <div className="flex gap-2">
          {day > 1 && <Button variant="ghost" asChild><Link href={`/program/${day - 1}`}><ArrowLeft className="rtl:-scale-x-100" /> {t("program.day", { day: day - 1 })}</Link></Button>}
          {day < 14 && <Button variant="outline" asChild><Link href={`/program/${day + 1}`}>{t("program.day", { day: day + 1 })} <ArrowRight className="rtl:-scale-x-100" /></Link></Button>}
        </div>
      </div>
      {!complete && read && d.quiz.length > 0 && <p className="pb-4 text-center text-xs text-muted">{t("program.needQuiz")}</p>}
    </div>
  );
}
