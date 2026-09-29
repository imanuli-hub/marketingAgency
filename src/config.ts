import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, "..");
export const CLIENTS_DIR = path.join(ROOT, "clients");
export const AGENTS_DIR = path.join(ROOT, "agents");

export const MODEL = process.env.AGENCY_MODEL ?? "claude-opus-5";

// Shared request settings for every agent. Server-side fallbacks re-run a
// refused request on a fallback model inside the same call.
export const BASE_PARAMS: Pick<BetaToolRunnerParams, "model" | "max_tokens" | "betas" | "fallbacks" | "cache_control"> = {
  model: MODEL,
  // Each tool-loop turn resends the whole conversation; caching makes that cheap.
  cache_control: { type: "ephemeral" },
  max_tokens: 64000,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

export const ORCHESTRATOR_MAX_ITERATIONS = 40;
export const SPECIALIST_MAX_ITERATIONS = 30;
