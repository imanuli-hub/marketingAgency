import Anthropic from "@anthropic-ai/sdk";
import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages";
import { BASE_PARAMS, SPECIALIST_MAX_ITERATIONS, TEST_MODE } from "../config.js";
import { WEB_TOOLS, appendActivity, workspaceTools } from "../tools/workspace.js";
import { AGENCY, getSpecialist, type AgentDefinition, type Effort } from "./roster.js";

export const client = new Anthropic();

/** Shared mission + one agent's CLAUDE.md = that agent's system prompt. */
export function systemPrompt(agent: AgentDefinition, clientSlug: string): string {
  return `${AGENCY}

Today's date is ${new Date().toISOString().slice(0, 10)}. You are working for the client "${clientSlug}".

---

You are the ${agent.name}.
Your goal: ${agent.goal}

${agent.instructions}`;
}

// $ per million tokens: [input, output]. Cache writes cost 1.25x input, reads 0.1x.
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5": [5, 25],
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5": [2, 10],
  "claude-haiku-4-5": [1, 5],
};

export interface UsageTotals {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  webSearches: number;
}

/** Token usage per agent name, accumulated across the current request. */
export const usage = new Map<string, UsageTotals>();

function record(label: string, u: Anthropic.Beta.BetaUsage) {
  const t = usage.get(label) ?? { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, webSearches: 0 };
  t.input += u.input_tokens;
  t.output += u.output_tokens;
  t.cacheWrite += u.cache_creation_input_tokens ?? 0;
  t.cacheRead += u.cache_read_input_tokens ?? 0;
  t.webSearches += u.server_tool_use?.web_search_requests ?? 0;
  usage.set(label, t);
}

/** Estimated dollars for token usage; web searches ($10 per 1,000) included. */
export function estimateCost(model: string, t: UsageTotals): number | undefined {
  const price = PRICES[model];
  if (!price) return undefined;
  const [inp, out] = price;
  return (
    (t.input * inp + t.cacheWrite * inp * 1.25 + t.cacheRead * inp * 0.1 + t.output * out) / 1_000_000 +
    t.webSearches * 0.01
  );
}

/**
 * Runs the tool loop to completion, resuming turns paused by server tools.
 * Streams each turn: long turns (web research, big documents) would otherwise
 * hit the SDK's request timeout.
 */
export async function runLoop(label: string, params: BetaToolRunnerParams): Promise<Anthropic.Beta.BetaMessage> {
  const runner = client.beta.messages.toolRunner({ ...params, stream: true });
  for await (const stream of runner) {
    const message = await stream.finalMessage();
    record(label, message.usage);
    if (message.stop_reason === "pause_turn") {
      runner.pushMessages({ role: "assistant", content: message.content });
    }
  }
  return runner.done();
}

export function textOf(message: Anthropic.Beta.BetaMessage): string {
  if (message.stop_reason === "refusal") {
    return `The request was declined (${message.stop_details?.category ?? "no category"}).`;
  }
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (message.stop_reason === "max_tokens") return `${text}\n\n[Output was cut off at the token limit.]`;
  return text || "(no text response)";
}

export function outputConfig(effort?: Effort) {
  if (TEST_MODE) return { output_config: { effort: "low" as const } };
  return effort ? { output_config: { effort } } : {};
}

/** Runs one specialist agent on one task for one client and returns its report. */
export async function runSpecialist(agentId: string, clientSlug: string, task: string): Promise<string> {
  const agent = getSpecialist(agentId);
  const system = systemPrompt(agent, clientSlug);

  await appendActivity(clientSlug, agent.name, `started: ${task.slice(0, 200)}`);

  const final = await runLoop(agent.name, {
    ...BASE_PARAMS,
    ...outputConfig(agent.effort),
    system,
    tools: [...workspaceTools(clientSlug, agent.name), ...(agent.webResearch ? WEB_TOOLS : [])],
    messages: [{ role: "user", content: task }],
    max_iterations: SPECIALIST_MAX_ITERATIONS,
  });

  const report = textOf(final);
  await appendActivity(clientSlug, agent.name, `finished: ${report.slice(0, 200).replace(/\n/g, " ")}`);
  return report;
}
