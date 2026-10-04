import fs from "fs/promises";
import path from "path";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL } from "../config.js";
import { client } from "../runtime/run.js";
import { clientDir } from "../tools/workspace.js";
import { EpisodeSchema, type Episode } from "./episode.js";

// Channel documents the scriptwriter must follow. Missing files are skipped.
const CHANNEL_DOCS = ["profile.md", "brand-voice.md", "strategy/content-rules.md", "briefs/emil-character-bible.md"];

async function channelContext(slug: string): Promise<string> {
  const parts: string[] = [];
  for (const rel of CHANNEL_DOCS) {
    try {
      parts.push(`<document path="${rel}">\n${await fs.readFile(path.join(clientDir(slug), rel), "utf8")}\n</document>`);
    } catch {
      // not written yet
    }
  }
  return parts.join("\n\n");
}

const FORMAT_RULES = {
  short: "A YouTube Short: 5–7 scenes, 35–55 seconds in total including pauses. One simple idea.",
  long: "A 3–5 minute video: 18–30 scenes. One clear story arc or lesson with gentle repetition.",
};

/** Writes the episode script as structured JSON, following the channel's own rules. */
export async function writeScript(opts: {
  slug: string;
  idea: string;
  format: "short" | "long";
}): Promise<Episode> {
  const system = `You are the head scriptwriter of a toddler YouTube channel (ages 2–4). Follow the channel documents below exactly: voice, vocabulary, pacing, safety rules and the character bible.

${await channelContext(opts.slug)}`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    cache_control: { type: "ephemeral" },
    output_config: { effort: "high", format: zodOutputFormat(EpisodeSchema) },
    system,
    messages: [
      {
        role: "user",
        content: `Write one episode.

Idea: ${opts.idea}
Format: ${opts.format}. ${FORMAT_RULES[opts.format]}

Each scene becomes one short animated clip played while the narration is spoken, so give every scene one clear, simple picture and one or two gentle movements. Keep the narration simple, with the channel's greeting and closing lines.

The narrator voice understands a few expression tags in square brackets, for example [softly], [whispers], [giggles], [warmly], [excited]. Use them sparingly (at most one per scene) where they add warmth or fun. Never put other bracketed text in the narration.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("The script request was declined.");
  if (!response.parsed_output) throw new Error(`Script did not match the schema (stop: ${response.stop_reason}).`);
  // Strip stray control characters the model occasionally emits.
  const clean = (text: string) => text.replace(/[\u0000-\u0008\u000b-\u001f]/g, "");
  const ep = response.parsed_output;
  return {
    ...ep,
    format: opts.format,
    title: clean(ep.title),
    description: clean(ep.description),
    scenes: ep.scenes.map((s) => ({ ...s, narration: clean(s.narration), visual: clean(s.visual) })),
  };
}
