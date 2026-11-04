import fs from "fs/promises";
import os from "os";
import path from "path";
import { uploadBlocker as eligible, nextSlots } from "../channel/rules.js";
import { loadChannelConfig, loadQueue, logLine, saveManifest, type Manifest } from "../channel/manifest.js";
import { getVideos, hasCredentials, recentUploadIds, uploadVideo } from "./api.js";

/**
 * Uploads approved, QC-passed episodes to YouTube as PRIVATE with a scheduled
 * publishAt, then verifies published ones. Safe to run repeatedly:
 *  - an episode with youtube.videoId is never uploaded again;
 *  - before uploading, recent channel uploads are checked for this episode's
 *    marker tag, so a run that uploaded but crashed before saving is caught;
 *  - nothing is uploaded unless approval.state is "approved", or the channel is
 *    in production with autoPublish explicitly enabled by the owner.
 *
 *   npm run yt:publish -- [--dry-run]
 */

const CHANNEL = process.env.CHANNEL ?? "invisible-explained";
const DRY = process.argv.includes("--dry-run");
const markerTag = (m: Manifest) => `tie-${m.id}`;

async function download(url: string, out: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  await fs.writeFile(out, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const cfg = await loadChannelConfig(CHANNEL);
  const autoPublish = cfg.autoPublish && cfg.phase === "production";
  const queue = await loadQueue(CHANNEL);
  const live = !DRY && hasCredentials();
  if (!DRY && !live) {
    console.log("YouTube credentials not configured (YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN); nothing to do.");
    return;
  }

  // 1. Upload
  const todo = queue.filter((q) => eligible(q.m, autoPublish) === null);
  for (const q of queue) {
    const why = eligible(q.m, autoPublish);
    if (why && why !== "already uploaded") console.log(`skip ${q.m.id}: ${why}`);
  }

  let recent: Map<string, string> | undefined; // marker tag -> videoId
  if (live && todo.length) {
    const vids = await getVideos(await recentUploadIds());
    recent = new Map(vids.flatMap((v) => (v.snippet?.tags ?? []).filter((t) => t.startsWith("tie-")).map((t) => [t, v.id] as const)));
  }

  const taken = new Set(queue.map((q) => q.m.schedule?.publishAt).filter((x): x is string => Boolean(x)));
  for (const { file, m } of todo) {
    // Re-slot anything whose publish time is missing or too close/past.
    if (!m.schedule || Date.parse(m.schedule.publishAt) < Date.now() + 30 * 60_000) {
      const [slot] = nextSlots(cfg, taken, 1);
      taken.add(slot);
      logLine(m, `publishAt ${m.schedule ? `moved from ${m.schedule.publishAt} ` : ""}to ${slot}`);
      m.schedule = { publishAt: slot };
    }
    const existing = recent?.get(markerTag(m));
    if (existing) {
      m.youtube = { ...m.youtube, videoId: existing, uploadedAt: new Date().toISOString() };
      m.status = "uploaded";
      logLine(m, `found existing upload ${existing}; not uploading again`);
      await saveManifest(file, m);
      continue;
    }
    if (DRY) {
      console.log(`DRY RUN would upload ${m.id} "${m.metadata!.title}" publishAt ${m.schedule.publishAt}`);
      continue;
    }
    const tmp = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "tie-")), `${m.id}.mp4`);
    try {
      await download(m.render!.url!, tmp);
      const v = await uploadVideo({
        file: tmp,
        title: m.metadata!.title,
        description: m.metadata!.description,
        tags: [...new Set([...m.metadata!.tags, ...cfg.publishing.defaultTags, markerTag(m)])].slice(0, 30),
        categoryId: cfg.publishing.categoryId,
        publishAt: m.schedule.publishAt,
        madeForKids: cfg.publishing.madeForKids,
        containsSyntheticMedia: cfg.publishing.containsSyntheticMedia,
      });
      m.youtube = { videoId: v.id, uploadedAt: new Date().toISOString(), privacyStatus: v.status?.privacyStatus };
      m.status = "uploaded";
      logLine(m, `uploaded ${v.id}, private until ${m.schedule.publishAt}`);
      console.log(`uploaded ${m.id} -> https://youtu.be/${v.id}`);
    } catch (err) {
      m.youtube = { ...m.youtube, lastError: (err as Error).message.slice(0, 300) };
      logLine(m, `upload error: ${(err as Error).message.slice(0, 120)}`);
      console.error(`upload failed ${m.id}: ${(err as Error).message}`);
      process.exitCode = 1;
    } finally {
      await fs.rm(path.dirname(tmp), { recursive: true, force: true });
      await saveManifest(file, m);
    }
  }

  // 2. Verify: uploaded episodes whose publish time has passed should be public.
  const due = queue.filter((q) => q.m.status === "uploaded" && q.m.youtube?.videoId);
  if (live && due.length) {
    const vids = new Map((await getVideos(due.map((q) => q.m.youtube!.videoId!))).map((v) => [v.id, v]));
    for (const { file, m } of due) {
      const v = vids.get(m.youtube!.videoId!);
      if (!v) {
        logLine(m, "video not found on channel (deleted?)");
        m.status = "failed";
      } else if (v.status?.uploadStatus === "rejected" || v.status?.uploadStatus === "failed") {
        logLine(m, `YouTube ${v.status.uploadStatus}: ${v.status.rejectionReason ?? v.status.failureReason ?? ""}`);
        m.status = "failed";
      } else if (v.status?.privacyStatus === "public") {
        m.status = "published";
        m.youtube = { ...m.youtube, privacyStatus: "public", verifiedAt: new Date().toISOString() };
        logLine(m, "verified public");
      } else if (m.schedule && Date.parse(m.schedule.publishAt) < Date.now() - 30 * 60_000) {
        logLine(m, `still ${v.status?.privacyStatus} 30 min after publishAt (unverified API project? see docs)`);
      } else continue;
      await saveManifest(file, m);
    }
  }
}

main().catch((err) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
});
