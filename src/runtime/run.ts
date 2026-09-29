import Anthropic from "@anthropic-ai/sdk";
import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages";
import { BASE_PARAMS, SPECIALIST_MAX_ITERATIONS } from "../config.js";
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

/** Runs the tool loop to completion, resuming turns paused by server tools. */
export async function runLoop(params: BetaToolRunnerParams & { stream?: false }): Promise<Anthropic.Beta.BetaMessage> {
  const runner = client.beta.messages.toolRunner(params);
  for await (const message of runner) {
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
  return effort ? { output_config: { effort } } : {};
}

/** Runs one specialist agent on one task for one client and returns its report. */
export async function runSpecialist(agentId: string, clientSlug: string, task: string): Promise<string> {
  const agent = getSpecialist(agentId);
  const system = systemPrompt(agent, clientSlug);

  await appendActivity(clientSlug, agent.name, `started: ${task.slice(0, 200)}`);

  const final = await runLoop({
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
