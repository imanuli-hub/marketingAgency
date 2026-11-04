import fs from "fs/promises";
import path from "path";
import { channelDir, loadQueue } from "../channel/manifest.js";
import { analyticsReport, getVideos, hasCredentials, recentUploadIds, rowsToObjects } from "./api.js";

/**
 * Pulls per-video performance for the last 90 days and writes
 *   analytics/latest.json      full numbers (machine-readable)
 *   analytics/latest-summary.md compact table the daily producer reads
 *
 * Not available through the public API (Studio only): the Shorts
 * "viewed vs. swiped away" ratio and "when your viewers are on YouTube".
 * Retention curves (audienceWatchRatio) are fetched per video.
 *
 *   npm run yt:analytics
 */

const CHANNEL = process.env.CHANNEL ?? "invisible-explained";
const day = (d: Date) => d.toISOString().slice(0, 10);

const CORE = "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares";

async function perVideo(start: string, end: string) {
  // engagedViews exists for Shorts on newer API versions; fall back without it.
  for (const metrics of [`${CORE},engagedViews`, CORE]) {
    try {
      return rowsToObjects(await analyticsReport({ startDate: start, endDate: end, metrics, dimensions: "video", sort: "-views", maxResults: "200" }));
    } catch (err) {
      if (metrics === CORE) throw err;
    }
  }
  return [];
}

async function retention(videoId: string, start: string, end: string) {
  const rows = rowsToObjects(
    await analyticsReport({ startDate: start, endDate: end, metrics: "audienceWatchRatio", dimensions: "elapsedVideoTimeRatio", filters: `video==${videoId}` }),
  );
  const at = (r: number) => rows.reduce((best, x) => (Math.abs(Number(x.elapsedVideoTimeRatio) - r) < Math.abs(Number(best.elapsedVideoTimeRatio) - r) ? x : best), rows[0] ?? {});
  return rows.length ? { p10: Number(at(0.1).audienceWatchRatio), p50: Number(at(0.5).audienceWatchRatio), p90: Number(at(0.9).audienceWatchRatio) } : null;
}

async function main() {
  if (!hasCredentials()) {
    console.log("YouTube credentials not configured; skipping analytics.");
    return;
  }
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 86400_000);
  const rows = await perVideo(day(start), day(end));
  const ids = [...new Set([...rows.map((r) => String(r.video)), ...(await recentUploadIds())])];
  const meta = new Map((await getVideos(ids)).map((v) => [v.id, v]));
  const byVideo = new Map((await loadQueue(CHANNEL)).filter((q) => q.m.youtube?.videoId).map((q) => [q.m.youtube!.videoId!, q.m]));

  const videos = [];
  for (const id of ids) {
    const r = rows.find((x) => x.video === id) ?? {};
    const m = byVideo.get(id);
    const v = meta.get(id);
    videos.push({
      videoId: id,
      title: v?.snippet?.title ?? "",
      publishedAt: v?.snippet?.publishedAt ?? null,
      episode: m?.id ?? null,
      pillar: m?.pillar ?? null,
      seconds: m?.render?.seconds ?? null,
      ...r,
      retention: Number(r.views ?? 0) > 0 ? await retention(id, day(start), day(end)).catch(() => null) : null,
    });
  }

  const dir = path.join(channelDir(CHANNEL), "analytics");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "latest.json"), JSON.stringify({ fetchedAt: end.toISOString(), window: [day(start), day(end)], videos }, null, 2) + "\n");

  const num = (x: unknown) => (x === undefined || x === null ? "-" : String(x));
  const summary = [
    `# Analytics summary (${day(start)} to ${day(end)}, fetched ${end.toISOString().slice(0, 16)}Z)`,
    "",
    "Viewed-vs-swiped and audience-online hours are Studio-only (not in the API).",
    "",
    "| Published | Title | Pillar | Views | Engaged | Avg dur s | Avg % | Ret@50% | Subs+ | Likes | Shares |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
    ...videos.map((x: Record<string, unknown> & { retention: { p50: number } | null }) =>
      `| ${num(x.publishedAt).slice(0, 16)} | ${String(x.title).slice(0, 50)} | ${num(x.pillar)} | ${num(x.views)} | ${num(x.engagedViews)} | ${num(x.averageViewDuration)} | ${num(x.averageViewPercentage)} | ${x.retention ? x.retention.p50.toFixed(2) : "-"} | ${num(x.subscribersGained)} | ${num(x.likes)} | ${num(x.shares)} |`,
    ),
    "",
  ].join("\n");
  await fs.writeFile(path.join(dir, "latest-summary.md"), summary);
  console.log(summary);
}

main().catch((err) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
});
