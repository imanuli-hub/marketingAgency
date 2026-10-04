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
  const total = LEAD_IN + (await durationOf(opts.audio)) + Math.max(0.5, opts.pauseAfter);
  const frames = Math.ceil(total * FPS);
  const step = (0.12 / frames).toFixed(6); // zoom 1.00 -> 1.12 over the scene
  const zoom = opts.index % 2 === 0 ? `1+${step}*on` : `1.12-${step}*on`;
  const sw = Math.round(w * 1.5);
  const sh = Math.round(h * 1.5);
  const delayMs = Math.round(LEAD_IN * 1000);

  const filter = [
    `[0:v]scale=${sw}:${sh}:force_original_aspect_ratio=increase,crop=${sw}:${sh},`,
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

/** Joins scene clips (all rendered with identical settings) into one video. */
export async function concatScenes(clips: string[], out: string): Promise<void> {
  const list = path.join(path.dirname(out), "scenes.txt");
  await fs.writeFile(list, clips.map((c) => `file '${path.resolve(c)}'`).join("\n"));
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
  await fs.rm(list);
}
