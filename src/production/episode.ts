import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { clientDir } from "../tools/workspace.js";

export const EXPRESSIONS = ["happy", "laughing", "sleepy", "surprised", "curious", "sad"] as const;

export const SceneSchema = z.object({
  narration: z.string().describe("What the narrator says during this scene. Short, simple toddler English."),
  visual: z
    .string()
    .describe(
      "What we see: Emil's action, pose and the location, in one or two plain sentences. Do not describe Emil's design; the reference image covers that.",
    ),
  expression: z.enum(EXPRESSIONS).describe("Emil's facial expression in this scene."),
  motion: z
    .string()
    .optional()
    .describe(
      "How the picture comes alive in the animated clip: one or two gentle movements (e.g. Emil slowly waves, the lantern flickers, the blanket rises as he breathes). Calm, small, toddler-friendly.",
    ),
  pause_after: z.number().describe("Seconds of quiet after the narration, 0.5–3. Longer for 'wait for the child' moments."),
});

export const EpisodeSchema = z.object({
  title: z.string().describe("YouTube title, under 60 characters, parent-facing and searchable."),
  description: z.string().describe("YouTube description, 2–4 short sentences for parents."),
  type: z.enum(["bedtime", "song", "learning"]),
  format: z.enum(["short", "long"]),
  lighting: z.enum(["day", "bedtime"]),
  scenes: z.array(SceneSchema),
});

export type Episode = z.infer<typeof EpisodeSchema>;
export type Scene = z.infer<typeof SceneSchema>;

/** Per-channel production settings, stored as channel.json in the client workspace. */
export const ChannelSchema = z.object({
  narratorVoiceId: z.string(),
  heroImage: z.string(),
  expressionsImage: z.string(),
  imageModel: z.string(),
  /** OpenArt image-to-video model; omit to make picture-only videos. */
  videoModel: z.string().optional(),
  videoResolution: z.string().optional(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export async function loadChannel(slug: string): Promise<Channel> {
  const file = path.join(clientDir(slug), "channel.json");
  return ChannelSchema.parse(JSON.parse(await fs.readFile(file, "utf8")));
}

export function episodeDir(slug: string, episode: string): string {
  return path.join(clientDir(slug), "episodes", episode);
}
