import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, "..");
export const CLIENTS_DIR = path.join(ROOT, "clients");
export const AGENTS_DIR = path.join(ROOT, "agents");

/** AGENCY_MODE=test: cheaper model, low effort, fewer web searches. For trying things out. */
export const TEST_MODE = process.env.AGENCY_MODE === "test";

export const MODEL = process.env.AGENCY_MODEL ?? (TEST_MODE ? "claude-sonnet-5" : "claude-opus-5");

export const WEB_MAX_USES = TEST_MODE ? 3 : 5;

// Server-side fallbacks re-run a refused request on a fallback model inside the
// same call. Only enabled for the models that need them.
const FALLBACK_MODELS = ["claude-opus-5", "claude-opus-5-5", "claude-fable-5-1"];
const fallbackParams: Pick<BetaToolRunnerParams, "betas" | "fallbacks"> = FALLBACK_MODELS.includes(MODEL)
  ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }
  : {};

// Shared request settings for every agent.
export const BASE_PARAMS: Pick<BetaToolRunnerParams, "model" | "max_tokens" | "betas" | "fallbacks" | "cache_control"> = {
  model: MODEL,
  // Each tool-loop turn resends the whole conversation; caching makes that cheap.
  cache_control: { type: "ephemeral" },
  max_tokens: 64000,
  ...fallbackParams,
};

export const ORCHESTRATOR_MAX_ITERATIONS = 40;
export const SPECIALIST_MAX_ITERATIONS = 30;
