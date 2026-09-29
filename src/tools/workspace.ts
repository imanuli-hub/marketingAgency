import type Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CLIENTS_DIR, WEB_MAX_USES } from "../config.js";

export function clientDir(slug: string): string {
  return path.join(CLIENTS_DIR, slug);
}

// Paths come from the model, so confine them to the client's folder.
function resolveInside(slug: string, relPath: string): string {
  const root = clientDir(slug);
  const target = path.resolve(root, relPath);
  const rel = path.relative(root, target);
  if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {
    throw new Error(`Path escapes the client workspace: ${relPath}`);
  }
  return target;
}

async function listRecursive(dir: string, base = ""): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) out.push(...(await listRecursive(path.join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

export async function appendActivity(slug: string, who: string, text: string): Promise<void> {
  const file = path.join(clientDir(slug), "activity.log");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, `[${new Date().toISOString()}] ${who}: ${text}\n`);
}

export async function listClients(): Promise<string[]> {
  try {
    const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith("_")).map((e) => e.name);
  } catch {
    return [];
  }
}

/** File tools scoped to one client's workspace, shared by every agent. */
export function workspaceTools(slug: string, agentName: string) {
  const listFiles = betaZodTool({
    name: "list_files",
    description: "List every file in the client's workspace (relative paths).",
    inputSchema: z.object({}),
    run: async () => {
      const files = await listRecursive(clientDir(slug));
      return files.length ? files.join("\n") : "(workspace is empty)";
    },
  });

  const readFile = betaZodTool({
    name: "read_file",
    description: "Read a file from the client's workspace.",
    inputSchema: z.object({ path: z.string().describe("Path relative to the client workspace, e.g. profile.md") }),
    run: async ({ path: p }) => {
      try {
        return await fs.readFile(resolveInside(slug, p), "utf8");
      } catch (err) {
        return `Error: ${(err as Error).message}`;
      }
    },
  });

  const writeFile = betaZodTool({
    name: "write_file",
    description:
      "Create or overwrite a file in the client's workspace. Use markdown. Read the file first if you are updating it.",
    inputSchema: z.object({
      path: z.string().describe("Path relative to the client workspace, e.g. drafts/morning-routine/script.md"),
      content: z.string(),
    }),
    run: async ({ path: p, content }) => {
      try {
        const target = resolveInside(slug, p);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content);
        await appendActivity(slug, agentName, `wrote ${p}`);
        return `Saved ${p}`;
      } catch (err) {
        return `Error: ${(err as Error).message}`;
      }
    },
  });

  return [listFiles, readFile, writeFile];
}

export const WEB_TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: WEB_MAX_USES },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: WEB_MAX_USES },
];
