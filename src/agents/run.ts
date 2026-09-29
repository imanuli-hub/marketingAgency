import Anthropic from "@anthropic-ai/sdk";
import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages";
import { BASE_PARAMS, SPECIALIST_MAX_ITERATIONS } from "../config.js";
import { WEB_TOOLS, appendActivity, workspaceTools } from "../tools/workspace.js";
import { getAgent, type Effort } from "./roster.js";

export const client = new Anthropic();

export const AGENCY_CHARTER = `You work at an AI marketing agency that grows Instagram and YouTube creators.
The agency is a team of specialist agents coordinated by an orchestrator. Everyone shares one workspace per client (files on disk).

Rules for everyone:
- Start by reading what already exists (list_files, then profile.md, brand-voice.md, and any files relevant to your task).
- Save your work to the workspace; don't just describe it. Use the folder conventions in your instructions.
- Never invent facts, metrics, or quotes about the creator. Mark unknowns clearly.
- Nothing is posted, sent, or paid for by agents. Humans approve and act.
- Today's date is ${new Date().toISOString().slice(0, 10)}.`;

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

function outputConfig(effort?: Effort) {
  return effort ? { output_config: { effort } } : {};
}

/** Runs one specialist agent on one task for one client and returns its report. */
export async function runSpecialist(agentId: string, clientSlug: string, task: string): Promise<string> {
  const agent = getAgent(agentId);
  const system = `${AGENCY_CHARTER}

You are the ${agent.name}.
Your goal: ${agent.goal}

${agent.instructions}

You are working for the client "${clientSlug}". When you finish, reply with a short report: what you did, the files you saved, and anything another team member or the creator needs to act on.`;

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
