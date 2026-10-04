import fs from "fs/promises";
import path from "path";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL } from "../config.js";
import { client } from "../runtime/run.js";
import { clientDir } from "../tools/workspace.js";
import { z } from "zod";
import { EpisodeSchema, SceneSchema, type Channel, type Episode } from "./episode.js";

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

/**
 * The episode schema for this channel: speakers and visible characters are
 * limited to the narrator and the channel's own cast.
 */
function scriptSchema(castIds: string[]) {
  const ids = castIds as [string, ...string[]];
  return EpisodeSchema.extend({
    scenes: z.array(
      SceneSchema.extend({
        speaker: z.enum(["narrator", ...ids]).describe('Who speaks: "narrator" or a character id.'),
        characters: z.array(z.enum(ids)).describe("Character ids visible in this scene, the speaker first."),
      }),
    ),
  });
}

function castBriefing(channel: Channel): string {
  const lines = Object.entries(channel.characters).map(
    ([id, c]) => `- ${id} (${c.name}): ${c.look ?? ""}. ${c.role ?? ""}`,
  );
  return lines.join("\n");
}

/** Writes the episode script as structured JSON, following the channel's own rules. */
export async function writeScript(opts: {
  slug: string;
  idea: string;
  format: "short" | "long";
  channel: Channel;
}): Promise<Episode> {
  const castIds = Object.keys(opts.channel.characters);
  const dialogue = castIds.length > 0 && Boolean(opts.channel.talkModel);
  const system = `You are the head scriptwriter of a toddler YouTube channel (ages 2–4). Follow the channel documents below exactly: voice, vocabulary, pacing, safety rules and the character bible.

${await channelContext(opts.slug)}`;

  const dialogueRules = `This is a dialogue cartoon: the characters talk to each other on screen.

Cast (use only these ids):
${castBriefing(opts.channel)}

Rules:
- Most scenes are one character saying one line, shown as a close-up of the speaker. Lines are short: at most 12 words, about 2–4 seconds to say.
- Alternate speakers like a real conversation. Use Emil plus one or two friends, never all four in one scene.
- The narrator ("narrator") speaks only in the first scene (a short greeting) and the last scene (the goodnight or closing), over a wider shot.
- "characters" lists who is visible; put the speaker first. Close-ups show only the speaker.
- Spoken lines are plain words only: no stage directions, no brackets, no sound effects in the text.`;

  const narrationRules = `Each scene becomes one short animated clip played while the narration is spoken. The narrator voice understands a few expression tags in square brackets, for example [softly], [whispers], [giggles], [warmly]. Use them sparingly (at most one per scene).`;

  const schema = dialogue ? scriptSchema(castIds) : EpisodeSchema;
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    cache_control: { type: "ephemeral" },
    output_config: { effort: "high", format: zodOutputFormat(schema) },
    system,
    messages: [
      {
        role: "user",
        content: `Write one episode.

Idea: ${opts.idea}
Format: ${opts.format}. ${FORMAT_RULES[opts.format]}

Give every scene one clear, simple picture and one or two gentle movements. Use the channel's greeting and closing lines.

${dialogue ? dialogueRules : narrationRules}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("The script request was declined.");
  if (!response.parsed_output) throw new Error(`Script did not match the schema (stop: ${response.stop_reason}).`);
  // Strip stray control characters the model occasionally emits.
  const clean = (text: string) => text.replace(/[\u0000-\u0008\u000b-\u001f]/g, "");
  const ep = response.parsed_output as Episode;
  return {
    ...ep,
    format: opts.format,
    title: clean(ep.title),
    description: clean(ep.description),
    scenes: ep.scenes.map((s) => ({ ...s, narration: clean(s.narration), visual: clean(s.visual) })),
  };
}
