import { execFile } from "child_process";
import fs from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { promisify } from "util";

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const FFMPEG: string = require("ffmpeg-static");

const FPS = 30;
const LEAD_IN = 0.4; // seconds of quiet before each scene's narration
const FADE = 0.4;

export const SIZES = { short: { w: 1080, h: 1920 }, long: { w: 1920, h: 1080 } } as const;

async function ffmpeg(args: string[]): Promise<string> {
  try {
    const { stderr } = await run(FFMPEG, ["-hide_banner", "-y", ...args], { maxBuffer: 64 * 1024 * 1024 });
    return stderr;
  } catch (err) {
    const e = err as { stderr?: string; message: string };
    throw new Error(`ffmpeg failed: ${(e.stderr || e.message).trim().split("\n").slice(-5).join("\n")}`);
  }
}

/** Media duration in seconds (ffmpeg prints it while probing). */
export async function durationOf(file: string): Promise<number> {
  const { stderr } = await run(FFMPEG, ["-hide_banner", "-i", file]).catch((e: { stderr: string }) => ({ stderr: e.stderr }));
  const m = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error(`Could not read duration of ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Seconds a scene lasts: lead-in, the narration, then a quiet tail. */
export async function sceneLength(audio: string, pauseAfter: number): Promise<number> {
  return LEAD_IN + (await durationOf(audio)) + Math.max(0.5, pauseAfter);
}

/**
 * Filter that scales a source to exactly w x h. When the shapes differ (e.g. a
 * square picture in a vertical Short) it shows the whole source over a blurred
 * fill instead of cropping the subject off.
 */
function fitOrFill(src: { w: number; h: number }, w: number, h: number): string {
  if (Math.abs(src.w / src.h - w / h) <= 0.05) {
    return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
  }
  return (
    `split[bgsrc][fgsrc];` +
    `[bgsrc]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=40:2,eq=brightness=-0.05[bg];` +
    `[fgsrc]scale=${w}:${h}:force_original_aspect_ratio=decrease[fg];` +
    `[bg][fg]overlay=(W-w)/2:(H-h)/2`
  );
}

async function imageSize(file: string): Promise<{ w: number; h: number }> {
  const { stderr } = await run(FFMPEG, ["-hide_banner", "-i", file]).catch((e: { stderr: string }) => ({ stderr: e.stderr }));
  const m = stderr.match(/Video:.*?, (\d{2,5})x(\d{2,5})/);
  if (!m) throw new Error(`Could not read image size of ${file}`);
  return { w: Number(m[1]), h: Number(m[2]) };
}

/**
 * One scene: the still image with a slow zoom (alternating in and out),
 * narration after a short lead-in, quiet tail, and soft fades.
 */
export async function renderScene(opts: {
  image: string;
  audio: string;
  pauseAfter: number;
  index: number;
  size: { w: number; h: number };
  out: string;
}): Promise<void> {
  const { w, h } = opts.size;
  const total = await sceneLength(opts.audio, opts.pauseAfter);
  const frames = Math.ceil(total * FPS);
  const step = (0.12 / frames).toFixed(6); // zoom 1.00 -> 1.12 over the scene
  const zoom = opts.index % 2 === 0 ? `1+${step}*on` : `1.12-${step}*on`;
  const sw = Math.round(w * 1.5);
  const sh = Math.round(h * 1.5);
  const delayMs = Math.round(LEAD_IN * 1000);

  const img = await imageSize(opts.image);
  const frame = `[0:v]${fitOrFill(img, sw, sh)},`;

  const filter = [
    frame,
    `zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${FPS},`,
    `fade=t=in:st=0:d=${FADE},fade=t=out:st=${(total - FADE).toFixed(2)}:d=${FADE},format=yuv420p[v];`,
    `[1:a]adelay=${delayMs}|${delayMs},apad,atrim=0:${total.toFixed(2)},`,
    `afade=t=out:st=${(total - 0.3).toFixed(2)}:d=0.3[a]`,
  ].join("");

  await ffmpeg([
    "-i", opts.image,
    "-i", opts.audio,
    "-filter_complex", filter,
    "-map", "[v]", "-map", "[a]",
    "-t", total.toFixed(2),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
    opts.out,
  ]);
}

/**
 * One scene from an animated clip: the clip (its own sound removed) fitted to
 * the video size, held on its last frame if it is shorter than the narration,
 * with the narration after a short lead-in and soft fades.
 */
export async function renderClipScene(opts: {
  clip: string;
  audio: string;
  pauseAfter: number;
  size: { w: number; h: number };
  out: string;
}): Promise<void> {
  const { w, h } = opts.size;
  const total = await sceneLength(opts.audio, opts.pauseAfter);
  const hold = Math.max(0, total - (await durationOf(opts.clip)) + 0.1);
  const delayMs = Math.round(LEAD_IN * 1000);
  const src = await imageSize(opts.clip);

  const filter = [
    `[0:v]fps=${FPS},tpad=stop_mode=clone:stop_duration=${hold.toFixed(2)},${fitOrFill(src, w, h)},setsar=1,`,
    `trim=0:${total.toFixed(2)},setpts=PTS-STARTPTS,`,
    `fade=t=in:st=0:d=${FADE},fade=t=out:st=${(total - FADE).toFixed(2)}:d=${FADE},format=yuv420p[v];`,
    `[1:a]adelay=${delayMs}|${delayMs},apad,atrim=0:${total.toFixed(2)},`,
    `afade=t=out:st=${(total - 0.3).toFixed(2)}:d=0.3[a]`,
  ].join("");

  await ffmpeg([
    "-i", opts.clip,
    "-i", opts.audio,
    "-filter_complex", filter,
    "-map", "[v]", "-map", "[a]",
    "-t", total.toFixed(2),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
    opts.out,
  ]);
}

/** Joins scene clips (all rendered with identical settings) into one video. */
export async function concatScenes(clips: string[], out: string): Promise<void> {
  const list = path.join(path.dirname(out), "scenes.txt");
  await fs.writeFile(list, clips.map((c) => `file '${path.resolve(c)}'`).join("\n"));
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
  await fs.rm(list);
}
