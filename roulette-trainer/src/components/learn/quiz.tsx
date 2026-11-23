"use client";
import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Progress } from "@/components/ui/form";
import type { QuizQuestion } from "@/lib/content/program";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { fmtMoney } from "@/lib/utils/format";

type Answer = number | null;

export function Quiz({ id, questions, passMark = 0.75 }: { id: string; questions: QuizQuestion[]; passMark?: number }) {
  const t = useT();
  const record = useAppStore((s) => s.recordQuiz);
  const prev = useAppStore((s) => s.quizzes[id]);
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null));
  const [drafts, setDrafts] = useState<string[]>(() => questions.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const correct = (q: QuizQuestion, a: Answer) => a !== null && (q.type === "numeric" ? Math.abs(a - q.answer) < 0.01 : a === q.answer);
  const answered = answers.filter((a) => a !== null).length;
  const score = answers.filter((a, i) => correct(questions[i], a)).length;

  const choose = (qi: number, value: number) => {
    if (answers[qi] !== null) return;
    const next = answers.map((a, i) => (i === qi ? value : a));
    setAnswers(next);
    if (next.every((a) => a !== null) && !submitted) {
      setSubmitted(true);
      record(id, next.filter((a, i) => correct(questions[i], a)).length, questions.length);
    }
  };

  return (
    <div className="space-y-4">
      {prev && <p className="text-xs text-muted">{t("quiz.best", { best: prev.best, total: prev.total, attempts: prev.attempts })}</p>}
      {questions.map((q, qi) => {
        const a = answers[qi];
        return (
          <fieldset key={qi} className="rounded-xl border border-border bg-surface-2/40 p-3">
            <legend className="sr-only">{t("quiz.question", { n: qi + 1 })}</legend>
            <p className="font-medium"><span className="text-gold">{qi + 1}.</span> {q.q}</p>
            {q.type === "numeric" ? (
              <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (drafts[qi] !== "") choose(qi, Number(drafts[qi])); }}>
                <Input type="number" inputMode="decimal" step="any" className="max-w-36" disabled={a !== null} value={drafts[qi]} aria-label={t("quiz.yourAnswer")}
                  onChange={(e) => setDrafts(drafts.map((d, i) => (i === qi ? e.target.value : d)))} placeholder="€" />
                {a === null ? <Button type="submit" variant="outline" disabled={drafts[qi] === ""}>{t("quiz.check")}</Button>
                  : correct(q, a) ? <span className="flex items-center gap-1 text-sm text-good"><CheckCircle2 className="size-4" aria-hidden /> {t("quiz.correct")}</span>
                  : <span className="flex items-center gap-1 text-sm text-danger"><XCircle className="size-4" aria-hidden /> {t("quiz.answerWas", { answer: fmtMoney(q.answer) })}</span>}
              </form>
            ) : (
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const isRight = oi === q.answer;
                  const chosen = a === oi;
                  return (
                    <button key={oi} type="button" onClick={() => choose(qi, oi)} disabled={a !== null}
                      className={cn("flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm touch-manipulation transition-colors",
                        a === null && "border-border hover:border-gold/50",
                        a !== null && isRight && "border-good/60 bg-good/10",
                        chosen && !isRight && "border-danger/60 bg-danger/10",
                        a !== null && !isRight && !chosen && "border-border opacity-60")}>
                      {a !== null && isRight && <CheckCircle2 className="size-4 shrink-0 text-good" aria-hidden />}
                      {chosen && !isRight && <XCircle className="size-4 shrink-0 text-danger" aria-hidden />}
                      {o}
                    </button>
                  );
                })}
              </div>
            )}
            {a !== null && <p className="mt-2 text-sm text-muted">{q.explain}</p>}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-40 flex-1"><Progress value={answered / questions.length} /></div>
        {submitted ? (
          <>
            <span className={cn("font-semibold", score / questions.length >= passMark ? "text-good" : "text-warn")}>
              {score / questions.length >= passMark ? t("quiz.passed", { score, total: questions.length }) : t("quiz.needed", { score, total: questions.length, need: Math.ceil(passMark * questions.length) })}
            </span>
            <Button variant="secondary" size="sm" onClick={() => { setAnswers(questions.map(() => null)); setDrafts(questions.map(() => "")); setSubmitted(false); }}><RotateCcw /> {t("quiz.retake")}</Button>
          </>
        ) : (
          <span className="text-sm text-muted">{t("quiz.answered", { n: answered, total: questions.length })}</span>
        )}
      </div>
    </div>
  );
}
