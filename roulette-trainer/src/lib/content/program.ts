import type { Locale } from "@/lib/utils/format";
import { PROGRAM_EN } from "./program.en";
import { PROGRAM_HE } from "./program.he";
import type { Phase, ProgramDay } from "./program-types";

export type { LessonSection, Phase, ProgramDay, QuizQuestion } from "./program-types";

const PROGRAMS: Record<Locale, ProgramDay[]> = { en: PROGRAM_EN, he: PROGRAM_HE };
export const getProgram = (locale: Locale) => PROGRAMS[locale];

const PHASE_NAMES: Record<Locale, string[]> = {
  en: ["Roulette fundamentals", "Flat betting practice", "Strategy comparison", "Casino rehearsal", "Final assessment"],
  he: ["יסודות הרולטה", "תרגול הימור קבוע", "השוואת אסטרטגיות", "חזרה כללית בקזינו", "הערכה סופית"],
};
const PHASE_DAYS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14]];
export const getPhases = (locale: Locale): Phase[] => PHASE_DAYS.map((days, i) => ({ days, name: PHASE_NAMES[locale][i] }));
