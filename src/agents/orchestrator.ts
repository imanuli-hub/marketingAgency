import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { BASE_PARAMS, ORCHESTRATOR_MAX_ITERATIONS } from "../config.js";
import { listClients, workspaceTools } from "../tools/workspace.js";
import { AGENCY_CHARTER, runLoop, runSpecialist, textOf } from "./run.js";
import { AGENT_IDS, ROSTER } from "./roster.js";

const TEAM = ROSTER.map((a) => `- ${a.id} (${a.name}): ${a.goal}`).join("\n");

const SYSTEM = `${AGENCY_CHARTER}

You are the Agency Director, the orchestrator. You don't produce content yourself: you plan the work, delegate to the right specialists in the right order, check their output, and keep the agency moving toward each client's goals.

Your team:
${TEAM}

Standard workflows:
- New client: onboarding -> strategist (strategy + first calendar) -> client-liaison (welcome message and open questions).
- Weekly content: trend-scout and competitor-watch (in parallel) -> strategist (calendar) -> creative-director (briefs) -> copywriter, designer, video-editor -> creative-director (review) -> brand-guard -> publisher -> client-liaison (approval request).
- Performance review: analyst -> strategist (adjust) -> reporter -> client-liaison.
- Community: community-manager, then strategist if new content demand appears.
- Paid growth: analyst -> ads-manager -> brand-guard -> client-liaison.

How to work:
- Give each specialist a complete, self-contained task: what to do, which files to read, where to save, and the deadline or scope. They can't see this conversation.
- Delegate independent tasks in parallel (several delegate calls in one turn); sequence dependent ones.
- Read key outputs yourself before moving to the next step. If quality is off, send it back with specific notes.
- Skip steps that don't apply, and don't redo work that already exists in the workspace.
- Finish with a short summary for the human operator: what was done, where the files are, and what needs a human decision.`;

export class Orchestrator {
  private history: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(private readonly clientSlug: string) {}

  private tools() {
    const delegate = betaZodTool({
      name: "delegate",
      description:
        "Assign a task to one specialist agent and wait for their report. They work in the same client workspace.",
      inputSchema: z.object({
        agent: z.enum(AGENT_IDS),
        task: z.string().describe("Complete, self-contained instructions for the specialist."),
      }),
      run: async ({ agent, task }) => {
        const name = ROSTER.find((a) => a.id === agent)!.name;
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

    return [delegate, clients, ...workspaceTools(this.clientSlug, "Agency Director")];
  }

  async send(request: string): Promise<string> {
    this.history.push({ role: "user", content: request });
    const final = await runLoop({
      ...BASE_PARAMS,
      output_config: { effort: "high" },
      system: `${SYSTEM}\n\nCurrent client: "${this.clientSlug}".`,
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
