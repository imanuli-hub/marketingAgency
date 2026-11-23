"use client";
import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CoachMode, SpinRecord } from "@/lib/coach/types";
import type { PlacedBet } from "@/lib/roulette/bets";
import type { EvenMoneyRule, TableRules } from "@/lib/roulette/engine";
import type { StrategyId } from "@/lib/roulette/strategies";
import type { WheelType } from "@/lib/roulette/wheel";
import { DEFAULT_PROFILE, settingsFromProfile, type CasinoPlan, type TrainingProfile } from "@/lib/training/profile";
import { uid, type Currency, type Locale } from "@/lib/utils/format";

export type { CasinoPlan, TrainingProfile };
/** practice = free/strategy practice on the persistent bankroll; casino = timed rehearsal; guided = tutorial. */
export type SessionMode = "practice" | "casino" | "guided";
export type MotionPref = "system" | "reduced" | "full";
export type OrientationPref = "auto" | "horizontal" | "vertical";

export interface Settings {
  locale: Locale;
  currency: Currency;
  profile: TrainingProfile;
  /** Lock the practice table when a stop rule is reached (no automatic restart). */
  enforceStopRules: boolean;
  wheel: WheelType;
  evenMoneyRule: EvenMoneyRule;
  minBet: number;
  maxInside: number;
  maxOutside: number;
  startingBankroll: number;
  coachMode: CoachMode;
  sound: boolean;
  motion: MotionPref;
  orientation: OrientationPref;
  breakReminderMins: number;
  /** Practice-mode loss limit per session (0 = off). */
  practiceStopLoss: number;
  practiceStopWin: number;
  /** Strategy the coach checks adherence against in practice mode. */
  practiceStrategy: StrategyId | null;
  practiceBaseBet: number;
  casinoPlan: CasinoPlan;
}

export interface SessionRecord {
  id: string;
  mode: SessionMode;
  startedAt: number;
  endedAt?: number;
  wheel: WheelType;
  rules: TableRules;
  startBalance: number;
  balance: number;
  peak: number;
  maxDrawdown: number;
  spinCount: number;
  wagered: number;
  theoreticalLoss: number;
  winningSpins: number;
  losingSpins: number;
  biggestStake: number;
  strategy: StrategyId | null;
  /** Stopping plan in force for this session (practice and casino). */
  plan?: CasinoPlan;
  /** Code: stopLoss | stopWin | timeLimit | bankrupt | manual | break | reset (older records may hold text). */
  endReason?: string;
  /** Even-money bets held "en prison" (stake already deducted). Persisted so a reload can't lose them. */
  prison?: PlacedBet[];
  /** Most recent spins (capped). */
  spins: SpinRecord[];
}

export interface QuizResult {
  best: number;
  last: number;
  attempts: number;
  total: number;
  at: number;
}

interface State {
  settings: Settings;
  bankroll: number;
  current: Partial<Record<SessionMode, SessionRecord>>;
  history: SessionRecord[];
  lessonsDone: Record<number, number>; // day -> completedAt
  quizzes: Record<string, QuizResult>; // "day-3" | "final"
  exercisesDone: Record<string, number>;
  programStartedAt: number | null;

  updateSettings(p: Partial<Settings>): void;
  /** Save the training profile and sync every setting it controls. */
  applyProfile(p: TrainingProfile, opts?: { resetBankroll?: boolean }): void;
  resetBankroll(amount?: number): void;
  startSession(mode: SessionMode, opts?: { balance?: number; plan?: CasinoPlan }): SessionRecord;
  recordSpin(mode: SessionMode, spin: SpinRecord, theoreticalLoss: number, prison?: PlacedBet[]): void;
  endSession(mode: SessionMode, reason?: string): SessionRecord | undefined;
  markLesson(day: number): void;
  recordQuiz(id: string, score: number, total: number): void;
  markExercise(id: string): void;
  resetAll(): void;
}

export const DEFAULT_SETTINGS: Settings = {
  locale: "he",
  currency: "EUR",
  profile: DEFAULT_PROFILE,
  enforceStopRules: true,
  evenMoneyRule: "none",
  minBet: 1,
  maxInside: 50,
  maxOutside: 200,
  coachMode: "beginner",
  sound: false,
  motion: "system",
  orientation: "auto",
  breakReminderMins: DEFAULT_PROFILE.sessionMinMins,
  ...settingsFromProfile(DEFAULT_PROFILE),
};

/** Stop plan for a new practice session, from the current settings. */
export const practicePlan = (s: Settings, balance: number): CasinoPlan => ({
  budget: balance,
  unit: s.practiceBaseBet,
  stopLoss: s.practiceStopLoss,
  stopWin: s.practiceStopWin,
  timeLimitMins: s.profile.sessionMaxMins,
  bettingSeconds: s.casinoPlan.bettingSeconds,
});

export const rulesFromSettings = (s: Settings): TableRules => ({
  wheel: s.wheel,
  evenMoneyRule: s.wheel === "european" ? s.evenMoneyRule : "none",
  minBet: s.minBet,
  maxInside: s.maxInside,
  maxOutside: s.maxOutside,
});

const MAX_SPINS_KEPT = 500;
const MAX_HISTORY = 200;
const r2 = (x: number) => Math.round(x * 100) / 100;

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      bankroll: DEFAULT_SETTINGS.startingBankroll,
      current: {},
      history: [],
      lessonsDone: {},
      quizzes: {},
      exercisesDone: {},
      programStartedAt: null,

      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      applyProfile: (p, opts) =>
        set((s) => {
          const hasSession = !!s.current.practice || !!s.current.casino;
          const synced = settingsFromProfile(p, s.settings.casinoPlan);
          return {
            settings: {
              ...s.settings,
              ...synced,
              // The wheel can't change mid-session.
              wheel: hasSession ? s.settings.wheel : synced.wheel,
              profile: p,
            },
            bankroll: opts?.resetBankroll && !s.current.practice ? p.bankroll : s.bankroll,
          };
        }),

      resetBankroll: (amount) => {
        get().endSession("practice", "reset");
        set((s) => ({ bankroll: amount ?? s.settings.startingBankroll }));
      },

      startSession: (mode, opts) => {
        const { settings, bankroll } = get();
        const balance = opts?.balance ?? bankroll;
        const rec: SessionRecord = {
          id: uid(),
          mode,
          startedAt: Date.now(),
          wheel: settings.wheel,
          rules: rulesFromSettings(settings),
          startBalance: balance,
          balance,
          peak: balance,
          maxDrawdown: 0,
          spinCount: 0,
          wagered: 0,
          theoreticalLoss: 0,
          winningSpins: 0,
          losingSpins: 0,
          biggestStake: 0,
          strategy: mode === "practice" ? settings.practiceStrategy : null,
          plan: opts?.plan ?? (mode === "practice" ? practicePlan(settings, balance) : undefined),
          spins: [],
          prison: [],
        };
        set((s) => ({ current: { ...s.current, [mode]: rec } }));
        return rec;
      },

      recordSpin: (mode, spin, theoreticalLoss, prison) => {
        let cur = get().current[mode];
        if (!cur) cur = get().startSession(mode);
        const balance = spin.balanceAfter;
        const peak = Math.max(cur.peak, balance);
        const next: SessionRecord = {
          ...cur,
          balance,
          peak,
          maxDrawdown: r2(Math.max(cur.maxDrawdown, peak - balance)),
          spinCount: cur.spinCount + 1,
          wagered: r2(cur.wagered + spin.staked),
          theoreticalLoss: r2(cur.theoreticalLoss + theoreticalLoss),
          winningSpins: cur.winningSpins + (spin.net > 0 ? 1 : 0),
          losingSpins: cur.losingSpins + (spin.net < 0 ? 1 : 0),
          biggestStake: Math.max(cur.biggestStake, spin.staked),
          spins: [...cur.spins, spin].slice(-MAX_SPINS_KEPT),
          prison: prison ?? [],
        };
        set((s) => ({
          current: { ...s.current, [mode]: next },
          bankroll: mode === "practice" ? balance : s.bankroll,
        }));
      },

      endSession: (mode, reason) => {
        const cur = get().current[mode];
        if (!cur) return undefined;
        const done = { ...cur, endedAt: Date.now(), endReason: reason };
        set((s) => {
          const current = { ...s.current };
          delete current[mode];
          return {
            current,
            history: cur.spinCount > 0 ? [done, ...s.history].slice(0, MAX_HISTORY) : s.history,
          };
        });
        return done;
      },

      markLesson: (day) =>
        set((s) => ({
          lessonsDone: { ...s.lessonsDone, [day]: s.lessonsDone[day] ?? Date.now() },
          programStartedAt: s.programStartedAt ?? Date.now(),
        })),

      recordQuiz: (id, score, total) =>
        set((s) => {
          const prev = s.quizzes[id];
          return {
            quizzes: {
              ...s.quizzes,
              [id]: { best: Math.max(prev?.best ?? 0, score), last: score, attempts: (prev?.attempts ?? 0) + 1, total, at: Date.now() },
            },
            programStartedAt: s.programStartedAt ?? Date.now(),
          };
        }),

      markExercise: (id) => set((s) => ({ exercisesDone: { ...s.exercisesDone, [id]: s.exercisesDone[id] ?? Date.now() } })),

      resetAll: () =>
        set({
          settings: DEFAULT_SETTINGS,
          bankroll: DEFAULT_SETTINGS.startingBankroll,
          current: {},
          history: [],
          lessonsDone: {},
          quizzes: {},
          exercisesDone: {},
          programStartedAt: null,
        }),
    }),
    {
      name: "roulette-trainer:v1",
      version: 2,
      // v1 → v2: adopt the personal training profile (euros, €100 bankroll) and the new settings.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<State>;
        if (version < 2) {
          const old = p.settings ?? ({} as Partial<Settings>);
          return {
            ...p,
            bankroll: DEFAULT_PROFILE.bankroll,
            current: {},
            settings: { ...DEFAULT_SETTINGS, coachMode: old.coachMode ?? DEFAULT_SETTINGS.coachMode, sound: old.sound ?? false, motion: old.motion ?? "system", orientation: old.orientation ?? "auto" },
          } as unknown as State;
        }
        return p as State;
      },
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        settings: s.settings,
        bankroll: s.bankroll,
        current: s.current,
        history: s.history,
        lessonsDone: s.lessonsDone,
        quizzes: s.quizzes,
        exercisesDone: s.exercisesDone,
        programStartedAt: s.programStartedAt,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(p.settings ?? {}),
            profile: { ...DEFAULT_PROFILE, ...(p.settings?.profile ?? {}) },
            casinoPlan: { ...DEFAULT_SETTINGS.casinoPlan, ...(p.settings?.casinoPlan ?? {}) },
          },
        };
      },
    },
  ),
);

export const useRules = () => {
  const settings = useAppStore((s) => s.settings);
  return useMemo(() => rulesFromSettings(settings), [settings]);
};
