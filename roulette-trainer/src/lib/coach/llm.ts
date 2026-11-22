/**
 * OPTIONAL future integration: an LLM-backed coach.
 *
 * Design: the LLM never computes odds or predicts numbers. It receives the
 * deterministic insights (already mathematically correct) plus a compact game
 * summary, and only rewrites them conversationally for the chosen level.
 * If the call fails, the deterministic insights are shown unchanged.
 *
 * To enable, add a server route (e.g. app/api/coach/route.ts) that forwards
 * `buildCoachPrompt(...)` to your LLM provider with the API key kept
 * server-side, then pass `createLlmCoach("/api/coach")` to the CoachPanel.
 */
import { analyze } from "./coach";
import type { CoachInput, CoachProvider, Insight } from "./types";

export const COACH_SYSTEM_PROMPT = `You are a roulette *education* coach inside a virtual-money training app.
Rules you must follow:
- Never predict or suggest specific numbers based on past results; spins are independent.
- Never claim any betting system beats the house edge or is guaranteed to profit.
- Only use the numbers provided in FACTS; do not invent probabilities.
- Encourage pre-set budgets, loss limits and breaks. Keep answers under 120 words.`;

export function buildCoachPrompt(input: CoachInput, facts: Insight[]): string {
  return [
    `LEVEL: ${input.mode}`,
    `WHEEL: ${input.rules.wheel} (${input.rules.evenMoneyRule})`,
    `BALANCE: ${input.balance}`,
    `BETS: ${input.bets.map((b) => `${b.label}=${b.amount}`).join(", ") || "none"}`,
    `FACTS:`,
    ...facts.map((f) => `- [${f.tone}] ${f.title}: ${f.body}`),
    `Rewrite FACTS as friendly coaching for the LEVEL above.`,
  ].join("\n");
}

export function createLlmCoach(endpoint: string): CoachProvider {
  return {
    async analyze(input) {
      const facts = analyze(input);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system: COACH_SYSTEM_PROMPT, prompt: buildCoachPrompt(input, facts) }),
        });
        if (!res.ok) return facts;
        const { text } = (await res.json()) as { text?: string };
        return text ? [{ id: "llm", tone: "info", title: "Coach", body: text }, ...facts] : facts;
      } catch {
        return facts;
      }
    },
  };
}
