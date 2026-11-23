import type { SessionRecord } from "@/store/app-store";

export const PROGRAM_DAYS = 14;
/** Days whose quiz must be passed (≥ 75%) to complete the day. Day 14 is the final assessment. */
export const QUIZ_DAYS = Array.from({ length: 13 }, (_, i) => i + 1);
export const FINAL_SECTIONS = ["knowledge", "payouts", "strategy", "bankroll", "etiquette"] as const;
export type FinalSection = (typeof FINAL_SECTIONS)[number];
export const finalQuizId = (s: FinalSection) => `final-${s}`;
export const PASS_MARK = 0.75;

export interface QuizScore { best: number; total: number }

export function quizPassed(q: QuizScore | undefined, mark = PASS_MARK): boolean {
  return !!q && q.total > 0 && q.best / q.total >= mark - 1e-9;
}

export function dayComplete(day: number, lessonsDone: Record<number, number>, quizzes: Record<string, QuizScore>): boolean {
  if (!lessonsDone[day]) return false;
  if (day === PROGRAM_DAYS) return FINAL_SECTIONS.every((s) => !!quizzes[finalQuizId(s)]);
  return quizPassed(quizzes[`day-${day}`]);
}

/** The training day to continue with: the first incomplete day (1..14). */
export function currentDay(lessonsDone: Record<number, number>, quizzes: Record<string, QuizScore>): number {
  for (let d = 1; d <= PROGRAM_DAYS; d++) if (!dayComplete(d, lessonsDone, quizzes)) return d;
  return PROGRAM_DAYS;
}

/** Counts a session toward practice milestones only if it had real play. */
export const MIN_SESSION_SPINS = 10;

export interface Milestone { id: "fundamentals" | "flatSessions" | "strategyLab" | "rehearsals" | "final"; done: number; target: number }

export function milestones(
  lessonsDone: Record<number, number>,
  quizzes: Record<string, QuizScore>,
  history: SessionRecord[],
  exercisesDone: Record<string, number>,
): Milestone[] {
  const days = (ds: number[]) => ds.filter((d) => dayComplete(d, lessonsDone, quizzes)).length;
  const flat = history.filter((h) => h.mode === "practice" && (h.strategy ?? "flat") === "flat" && h.spinCount >= MIN_SESSION_SPINS).length;
  const rehearsals = history.filter((h) => h.mode === "casino" && h.spinCount > 0).length;
  return [
    { id: "fundamentals", done: days([1, 2, 3]), target: 3 },
    { id: "flatSessions", done: Math.min(3, flat), target: 3 },
    { id: "strategyLab", done: days([7, 8, 9]) + (exercisesDone["sim-target-experiment"] ? 1 : 0), target: 4 },
    { id: "rehearsals", done: Math.min(3, rehearsals), target: 3 },
    { id: "final", done: FINAL_SECTIONS.filter((s) => !!quizzes[finalQuizId(s)]).length, target: FINAL_SECTIONS.length },
  ];
}
