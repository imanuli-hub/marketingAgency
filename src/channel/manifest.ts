import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { ROOT } from "../config.js";

/**
 * One episode = one JSON manifest in channels/<channel>/queue/.
 * It is the single source of truth for that video: every production step
 * records its result here, so a crashed run resumes where it stopped and no
 * paid asset is ever generated twice.
 */

export const STATUSES = [
  "planned", // topic chosen
  "scripted", // script + storyboard written
  "fact_checked", // every claim sourced (factCheck.verdict = pass)
  "assets_ready", // voice, stills, clips generated and recorded
  "rendered", // final MP4 uploaded to Higgsfield media
  "qc_passed", // automated + visual QC passed
  "uploaded", // on YouTube as private, scheduled (publishAt)
  "published", // verified public on YouTube
  "failed", // stopped; see log
  "rejected", // owner rejected; never publish
] as const;
export type Status = (typeof STATUSES)[number];

const Claim = z.object({ claim: z.string(), source: z.string(), url: z.string().optional() });

const Scene = z.object({
  n: z.number().int(),
  seconds: z.number(),
  narration: z.string(),
  visual: z.string().describe("What we see, as a generation-ready description"),
  label: z.string().describe("Top scene label, e.g. 'CEREBELLUM · ILLUSTRATIVE'"),
  style: z.enum(["photoreal", "cartoon", "graphic"]).optional().describe("photoreal = AI still/clip; cartoon = mascot drawn in code; graphic = navy/cyan motion graphics in code"),
  voice: z.string().optional().describe("Narrator name for this scene's line"),
  animate: z.boolean().default(false).describe("true = this still is animated with the video model"),
  motion: z.string().optional(),
  overlay: z.string().optional().describe("Data callout or diagram drawn in code"),
});

const Asset = z.object({
  jobId: z.string().optional(),
  mediaId: z.string().optional(),
  url: z.string().optional(),
  model: z.string().optional(),
  credits: z.number().default(0),
  attempts: z.number().int().default(0),
});

export const ManifestSchema = z.object({
  id: z.string(),
  channel: z.string(),
  slug: z.string(),
  topic: z.string(),
  pillar: z.string(),
  createdAt: z.string(),
  status: z.enum(STATUSES),
  approval: z.object({
    state: z.enum(["pending", "approved", "rejected"]),
    by: z.string().optional(),
    at: z.string().optional(),
    notes: z.string().optional(),
  }),
  script: z
    .object({
      voiceText: z.string().describe("Exact ElevenLabs v4 input, delivery tags included (all turns joined)"),
      dialogue: z
        .array(z.object({ voice: z.string(), voiceId: z.string(), text: z.string() }))
        .optional()
        .describe("Multi-narrator take: one ElevenLabs v4 dialogue turn per entry, in order"),
      words: z.number().int(),
      estSeconds: z.number(),
    })
    .optional(),
  factCheck: z.object({ verdict: z.enum(["pending", "pass", "fail"]), claims: z.array(Claim) }).optional(),
  storyboard: z.array(Scene).default([]),
  assets: z
    .object({
      voice: Asset.optional(),
      scenes: z.record(z.string(), z.object({ image: Asset.optional(), clip: Asset.optional() })).default({}),
    })
    .default({ scenes: {} }),
  render: z
    .object({ mediaId: z.string().optional(), url: z.string().optional(), seconds: z.number().optional() })
    .optional(),
  qc: z
    .object({
      verdict: z.enum(["pending", "pass", "fail"]),
      checks: z.array(z.object({ name: z.string(), pass: z.boolean(), note: z.string().optional() })),
    })
    .optional(),
  metadata: z
    .object({
      title: z.string().max(100),
      description: z.string().max(5000),
      tags: z.array(z.string()),
    })
    .optional(),
  schedule: z.object({ publishAt: z.string() }).optional(),
  youtube: z
    .object({
      videoId: z.string().optional(),
      uploadedAt: z.string().optional(),
      verifiedAt: z.string().optional(),
      privacyStatus: z.string().optional(),
      lastError: z.string().optional(),
    })
    .optional(),
  credits: z.object({ estimated: z.number(), spent: z.number() }),
  log: z.array(z.string()).default([]),
});
export type Manifest = z.infer<typeof ManifestSchema>;

export function channelDir(channel: string): string {
  return path.join(ROOT, "channels", channel);
}

export function queueDir(channel: string): string {
  return path.join(channelDir(channel), "queue");
}

export async function loadQueue(channel: string): Promise<{ file: string; m: Manifest }[]> {
  const dir = queueDir(channel);
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json")).sort();
  const out: { file: string; m: Manifest }[] = [];
  for (const f of files) {
    const file = path.join(dir, f);
    const parsed = ManifestSchema.safeParse(JSON.parse(await fs.readFile(file, "utf8")));
    if (!parsed.success) throw new Error(`${f}: invalid manifest: ${parsed.error.message.slice(0, 400)}`);
    out.push({ file, m: parsed.data });
  }
  return out;
}

export async function saveManifest(file: string, m: Manifest): Promise<void> {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(ManifestSchema.parse(m), null, 2) + "\n");
  await fs.rename(tmp, file); // atomic: a crash never leaves half a manifest
}

export function logLine(m: Manifest, msg: string): void {
  m.log.push(`${new Date().toISOString().slice(0, 16)}Z ${msg}`);
}

export async function loadChannelConfig(channel: string): Promise<ChannelConfig> {
  return JSON.parse(await fs.readFile(path.join(channelDir(channel), "channel.json"), "utf8"));
}

export interface ChannelConfig {
  name: string;
  phase: "testing" | "production";
  autoPublish: boolean;
  videosPerDay: number;
  budget: {
    dailyCredits: number;
    monthlyCredits: number;
    perVideoCredits: number;
    maxRetriesPerAsset: number;
    stopIfBalanceBelow: number;
  };
  publishing: {
    timezone: string;
    slots: string[];
    privacyUntilPublish: string;
    categoryId: string;
    madeForKids: boolean;
    containsSyntheticMedia: boolean;
    defaultTags: string[];
  };
}
