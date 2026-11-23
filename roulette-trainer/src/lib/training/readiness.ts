import { buildSessionReview } from "@/lib/analytics/review";
import type { SessionRecord } from "@/store/app-store";
import { FINAL_SECTIONS, PROGRAM_DAYS, dayComplete, finalQuizId, MIN_SESSION_SPINS, type FinalSection, type QuizScore } from "./program-state";

export interface ReadinessReport {
  /** 0..1 overall. */
  score: number;
  level: "ready" | "nearly" | "progress" | "start";
  sections: Record<FinalSection, number | null>;
  knowledge: number;
  /** Average plan-discipline (0..1) over the last three sessions. */
  discipline: number | null;
  sessionsAssessed: number;
  sessionScores: number[];
  programCompletion: number;
  lessons: number;
}

/**
 * Readiness reflects knowledge and discipline only. Session profit is never an
 * input: a lucky winning session scores the same as an unlucky one played to plan.
 */
export function readinessReport(
  lessonsDone: Record<number, number>,
  quizzes: Record<string, QuizScore>,
  history: SessionRecord[],
): ReadinessReport {
  const sections = Object.fromEntries(
    FINAL_SECTIONS.map((s) => {
      const q = quizzes[finalQuizId(s)];
      return [s, q ? q.best / q.total : null];
    }),
  ) as Record<FinalSection, number | null>;
  const knowledge = FINAL_SECTIONS.reduce((a, s) => a + (sections[s] ?? 0), 0) / FINAL_SECTIONS.length;
  const recent = history
    .filter((h) => (h.mode === "practice" || h.mode === "casino") && h.spinCount >= MIN_SESSION_SPINS && h.plan)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 3);
  const sessionScores = recent.map((h) => buildSessionReview(h).discipline / 100);
  // Missing sessions count as zero so three sessions are required for full credit.
  const discipline = recent.length ? sessionScores.reduce((a, b) => a + b, 0) / 3 : null;
  const lessons = Array.from({ length: PROGRAM_DAYS }, (_, i) => i + 1).filter((d) => !!lessonsDone[d]).length;
  const completed = Array.from({ length: PROGRAM_DAYS }, (_, i) => i + 1).filter((d) => dayComplete(d, lessonsDone, quizzes)).length;
  const programCompletion = completed / PROGRAM_DAYS;
  const score = 0.5 * knowledge + 0.3 * (discipline ?? 0) + 0.2 * programCompletion;
  const level = score >= 0.85 ? "ready" : score >= 0.6 ? "nearly" : score >= 0.3 ? "progress" : "start";
  return { score, level, sections, knowledge, discipline, sessionsAssessed: recent.length, sessionScores, programCompletion, lessons };
}
