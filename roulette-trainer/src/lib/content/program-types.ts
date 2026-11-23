export type QuizQuestion =
  | { type?: "choice"; q: string; options: string[]; answer: number; explain: string }
  | { type: "numeric"; q: string; answer: number; explain: string };

export interface LessonSection {
  heading: string;
  body?: string[];
  bullets?: string[];
}

export interface ProgramDay {
  day: number;
  phase: string;
  title: string;
  minutes: number;
  goals: string[];
  /** Daily practice objective. */
  objective: string;
  sections: LessonSection[];
  exercise: { id: string; title: string; description: string; href: string; cta: string };
  quiz: QuizQuestion[];
}

export interface Phase { days: number[]; name: string }
