"use client";
import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/form";
import type { QuizQuestion } from "@/lib/content/program";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

export function Quiz({ id, questions, passMark = 0.75 }: { id: string; questions: QuizQuestion[]; passMark?: number }) {
  const record = useAppStore((s) => s.recordQuiz);
  const prev = useAppStore((s) => s.quizzes[id]);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const answered = answers.filter((a) => a !== null).length;
  const score = answers.filter((a, i) => a === questions[i].answer).length;

  const choose = (qi: number, oi: number) => {
    if (answers[qi] !== null) return;
    const next = answers.map((a, i) => (i === qi ? oi : a));
    setAnswers(next);
    if (next.every((a) => a !== null) && !submitted) {
      setSubmitted(true);
      record(id, next.filter((a, i) => a === questions[i].answer).length, questions.length);
    }
  };

  return (
    <div className="space-y-4">
      {prev && <p className="text-xs text-muted">Best score {prev.best}/{prev.total} · {prev.attempts} attempt{prev.attempts === 1 ? "" : "s"}</p>}
      {questions.map((q, qi) => {
        const a = answers[qi];
        return (
          <fieldset key={qi} className="rounded-xl border border-border bg-surface-2/40 p-3">
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="font-medium"><span className="text-gold">{qi + 1}.</span> {q.q}</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const isRight = oi === q.answer;
                const chosen = a === oi;
                return (
                  <button key={oi} type="button" onClick={() => choose(qi, oi)} disabled={a !== null}
                    className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm touch-manipulation transition-colors",
                      a === null && "border-border hover:border-gold/50",
                      a !== null && isRight && "border-good/60 bg-good/10",
                      chosen && !isRight && "border-danger/60 bg-danger/10",
                      a !== null && !isRight && !chosen && "border-border opacity-60")}>
                    {a !== null && isRight && <CheckCircle2 className="size-4 shrink-0 text-good" />}
                    {chosen && !isRight && <XCircle className="size-4 shrink-0 text-danger" />}
                    {o}
                  </button>
                );
              })}
            </div>
            {a !== null && <p className="mt-2 text-sm text-muted">{q.explain}</p>}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-40 flex-1"><Progress value={answered / questions.length} /></div>
        {submitted ? (
          <>
            <span className={cn("font-semibold", score / questions.length >= passMark ? "text-good" : "text-warn")}>
              {score}/{questions.length} {score / questions.length >= passMark ? "— passed" : `— ${Math.ceil(passMark * questions.length)} needed to pass`}
            </span>
            <Button variant="secondary" size="sm" onClick={() => { setAnswers(questions.map(() => null)); setSubmitted(false); }}><RotateCcw /> Retake</Button>
          </>
        ) : (
          <span className="text-sm text-muted">{answered}/{questions.length} answered</span>
        )}
      </div>
    </div>
  );
}
