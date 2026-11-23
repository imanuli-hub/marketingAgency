import { describe, expect, it } from "vitest";
import { ASSESSMENT } from "../assessment";
import { getProgram } from "../program";
import { FINAL_SECTIONS } from "@/lib/training/program-state";

describe("localized program content", () => {
  const en = getProgram("en");
  const he = getProgram("he");
  it("has 14 days in both languages with identical structure", () => {
    expect(en).toHaveLength(14);
    expect(he).toHaveLength(14);
    en.forEach((d, i) => {
      const h = he[i];
      expect(h.day).toBe(d.day);
      expect(h.exercise.id).toBe(d.exercise.id);
      expect(h.exercise.href).toBe(d.exercise.href);
      expect(h.quiz.length).toBe(d.quiz.length);
      expect(h.sections.length).toBe(d.sections.length);
      d.quiz.forEach((q, k) => {
        const hq = h.quiz[k];
        expect(hq.type ?? "choice").toBe(q.type ?? "choice");
        expect(hq.answer).toBe(q.answer);
        if (q.type !== "numeric" && hq.type !== "numeric") expect(hq.options.length).toBe(q.options.length);
      });
    });
  });
  it("Hebrew content is actually Hebrew", () => {
    for (const d of he) expect(d.title).toMatch(/[֐-׿]/);
  });
  it("every choice answer index is valid", () => {
    for (const d of [...en, ...he]) for (const q of d.quiz) if (q.type !== "numeric") expect(q.answer).toBeLessThan(q.options.length);
  });
  it("days 1–13 have quizzes; day 14 uses the assessment", () => {
    en.slice(0, 13).forEach((d) => expect(d.quiz.length).toBeGreaterThan(0));
    expect(en[13].quiz).toHaveLength(0);
  });
});

describe("final assessment bank", () => {
  it("has all five sections in both languages with matching answers", () => {
    for (const s of FINAL_SECTIONS) {
      expect(ASSESSMENT.en[s].length).toBeGreaterThanOrEqual(5);
      expect(ASSESSMENT.he[s].map((q) => q.answer)).toEqual(ASSESSMENT.en[s].map((q) => q.answer));
    }
  });
  it("numeric payout answers are mathematically correct", () => {
    const stakes = [[2, 35, true], [5, 11, false], [2, 5, true], [10, 1, true], [3, 17, false]] as const;
    ASSESSMENT.en.payouts.forEach((q, i) => {
      const [stake, payout, total] = stakes[i];
      expect(q.answer).toBe(stake * payout + (total ? stake : 0));
    });
  });
});
