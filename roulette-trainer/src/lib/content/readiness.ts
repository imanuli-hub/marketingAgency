import type { QuizResult, SessionRecord } from "@/store/app-store";
import { PROGRAM } from "./program";

export interface Readiness {
  score: number;
  lessons: number;
  quizAvg: number;
  finalScore: number | null;
  casinoSessions: number;
  onPlanSessions: number;
  level: string;
}

/** A composite readiness score (0..1) from lessons, quizzes and casino rehearsals. */
export function computeReadiness(
  lessonsDone: Record<number, number>,
  quizzes: Record<string, QuizResult>,
  history: SessionRecord[],
): Readiness {
  const lessons = PROGRAM.filter((d) => lessonsDone[d.day]).length;
  const dayQuizzes = PROGRAM.filter((d) => d.quiz.length).map((d) => quizzes[`day-${d.day}`]);
  const quizAvg = dayQuizzes.reduce((s, q) => s + (q ? q.best / q.total : 0), 0) / dayQuizzes.length;
  const final = quizzes.final;
  const finalScore = final ? final.best / final.total : null;
  const casino = history.filter((h) => h.mode === "casino");
  const onPlan = casino.filter((h) => h.endReason && !/abandon/i.test(h.endReason)).length;
  const score = 0.3 * (lessons / PROGRAM.length) + 0.3 * quizAvg + 0.2 * (finalScore ?? 0) + 0.2 * Math.min(1, onPlan / 3);
  const level = score >= 0.85 ? "Casino ready" : score >= 0.6 ? "Nearly ready" : score >= 0.3 ? "Making progress" : "Getting started";
  return { score, lessons, quizAvg, finalScore, casinoSessions: casino.length, onPlanSessions: onPlan, level };
}
