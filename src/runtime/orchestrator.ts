import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { BASE_PARAMS, ORCHESTRATOR_MAX_ITERATIONS } from "../config.js";
import { listClients, workspaceTools } from "../tools/workspace.js";
import { outputConfig, runLoop, runSpecialist, systemPrompt, textOf } from "./run.js";
import { DIRECTOR, SPECIALISTS, SPECIALIST_IDS } from "./roster.js";

const TEAM = SPECIALISTS.map((a) => `- ${a.id} (${a.name}): ${a.goal}`).join("\n");

export class Orchestrator {
  private history: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(private readonly clientSlug: string) {}

  private tools() {
    const delegate = betaZodTool({
      name: "delegate",
      description:
        "Assign a task to one specialist agent and wait for their report. They work in the same client workspace.",
      inputSchema: z.object({
        agent: z.enum(SPECIALIST_IDS),
        task: z.string().describe("Complete, self-contained instructions for the specialist."),
      }),
      run: async ({ agent, task }) => {
        const name = SPECIALISTS.find((a) => a.id === agent)!.name;
        console.log(`  -> ${name}: ${task.split("\n")[0].slice(0, 100)}`);
        try {
          const report = await runSpecialist(agent, this.clientSlug, task);
          console.log(`  <- ${name} done`);
          return report;
        } catch (err) {
          console.log(`  <- ${name} failed: ${(err as Error).message}`);
          return `Error: ${name} failed: ${(err as Error).message}`;
        }
      },
    });

    const clients = betaZodTool({
      name: "list_clients",
      description: "List all clients the agency works with.",
      inputSchema: z.object({}),
      run: async () => (await listClients()).join("\n") || "(no clients yet)",
    });

    return [delegate, clients, ...workspaceTools(this.clientSlug, DIRECTOR.name)];
  }

  async send(request: string): Promise<string> {
    this.history.push({ role: "user", content: request });
    const final = await runLoop({
      ...BASE_PARAMS,
      ...outputConfig(DIRECTOR.effort),
      system: `${systemPrompt(DIRECTOR, this.clientSlug)}\n\n## Your team\n\n${TEAM}`,
      tools: this.tools(),
      messages: this.history,
      max_iterations: ORCHESTRATOR_MAX_ITERATIONS,
    });
    const reply = textOf(final);
    // Keep only the final text between turns; the workspace holds the real state.
    this.history.push({ role: "assistant", content: reply });
    return reply;
  }
}
