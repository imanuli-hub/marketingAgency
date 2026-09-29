import fs from "fs";
import path from "path";
import { AGENTS_DIR } from "../config.js";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface AgentDefinition {
  id: string;
  name: string;
  goal: string;
  /** The CLAUDE.md body below the frontmatter. */
  instructions: string;
  /** Gives the agent web search and web fetch. */
  webResearch: boolean;
  effort?: Effort;
}

const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];
export const DIRECTOR_ID = "director";

function parseAgentFile(id: string, file: string): AgentDefinition {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file} must start with a --- frontmatter block`);

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!meta.name || !meta.goal) throw new Error(`${file} needs "name" and "goal" in its frontmatter`);
  if (meta.effort && !EFFORTS.includes(meta.effort as Effort)) {
    throw new Error(`${file}: effort must be one of ${EFFORTS.join(", ")}`);
  }

  return {
    id,
    name: meta.name,
    goal: meta.goal,
    instructions: match[2].trim(),
    webResearch: meta.web_research === "true",
    effort: meta.effort as Effort | undefined,
  };
}

function loadAgents(): AgentDefinition[] {
  return fs
    .readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(AGENTS_DIR, e.name, "CLAUDE.md")))
    .map((e) => parseAgentFile(e.name, path.join(AGENTS_DIR, e.name, "CLAUDE.md")))
    .sort((a, b) => a.id.localeCompare(b.id));
}

const ALL = loadAgents();

/** The shared mission every agent reads first. */
export const AGENCY = fs.readFileSync(path.join(AGENTS_DIR, "AGENCY.md"), "utf8").trim();

export const DIRECTOR = ALL.find((a) => a.id === DIRECTOR_ID) ?? (() => {
  throw new Error(`Missing agents/${DIRECTOR_ID}/CLAUDE.md`);
})();

export const SPECIALISTS = ALL.filter((a) => a.id !== DIRECTOR_ID);
if (SPECIALISTS.length === 0) throw new Error("No specialist agents found in agents/");

export const SPECIALIST_IDS = SPECIALISTS.map((a) => a.id) as [string, ...string[]];

export function getSpecialist(id: string): AgentDefinition {
  const agent = SPECIALISTS.find((a) => a.id === id);
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}
