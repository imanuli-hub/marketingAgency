import { execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import type { Channel, Episode, Scene } from "./episode.js";

const run = promisify(execFile);
const OPENART = process.env.OPENART_BIN ?? path.join(os.homedir(), ".local/bin/openart");

const STYLE = `Still frame from a stylized 3D animated preschool series. Clean simple composition, one clear focal point, matte soft materials, short velvety fur, natural soft lighting, limited harmonious colors, everything in focus. No text, no letters, no watermark. Avoid: sunset glow everywhere, fireflies, sparkles, lens flare, heavy background blur, clutter, scary or dark mood.`;

const LIGHTING = {
  day: "Bright, soft afternoon daylight.",
  bedtime: "Calm evening: warm indoor lamp light and the glow of Emil's lantern, dim and cosy but never dark.",
};

export function scenePrompt(scene: Scene, episode: Episode): string {
  return `Using the character in the reference image exactly (same design, colors, proportions, curl, ears, lantern, materials and 3D style), show Emil: ${scene.visual} His expression: ${scene.expression}. ${LIGHTING[episode.lighting]} ${STYLE}`;
}

let aspectSupport: boolean | undefined;

/** Newer OpenArt CLI versions accept --aspect-ratio; older ones reject it. */
async function supportsAspectRatio(): Promise<boolean> {
  if (aspectSupport === undefined) {
    const { stdout } = await run(OPENART, ["generate", "image", "--help"]);
    aspectSupport = stdout.includes("--aspect-ratio");
  }
  return aspectSupport;
}

/** Generates one image with OpenArt and saves it to `out`. Returns the path. */
export async function generateImage(opts: {
  prompt: string;
  model: string;
  references: string[];
  aspectRatio: "9:16" | "16:9";
  out: string;
}): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "openart-"));
  const args = ["generate", "image", opts.prompt, "--model", opts.model, "-o", tmp, "--quiet", "--no-input"];
  for (const ref of opts.references) args.push("--image", ref);
  if (await supportsAspectRatio()) args.push("--aspect-ratio", opts.aspectRatio);

  try {
    await run(OPENART, args, { timeout: 5 * 60_000 });
  } catch (err) {
    const e = err as { stderr?: string; message: string };
    throw new Error(`OpenArt failed: ${(e.stderr || e.message).trim().slice(0, 300)}`);
  }
  const [file] = (await fs.readdir(tmp)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (!file) throw new Error("OpenArt returned no image");
  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.copyFile(path.join(tmp, file), opts.out);
  await fs.rm(tmp, { recursive: true, force: true });
  return opts.out;
}

/** One image per scene, skipping scenes whose image already exists. */
export async function generateSceneImages(opts: {
  episode: Episode;
  channel: Channel;
  dir: string;
  onProgress?: (msg: string) => void;
}): Promise<string[]> {
  const { episode, channel, dir } = opts;
  const aspectRatio = episode.format === "short" ? "9:16" : "16:9";
  const files: string[] = [];

  // A few at a time keeps OpenArt happy and still saves time.
  const CONCURRENCY = 3;
  const queue = episode.scenes.map((scene, i) => ({ scene, i }));
  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const out = path.join(dir, `scene-${String(job.i + 1).padStart(2, "0")}.png`);
      files[job.i] = out;
      if (await exists(out)) continue;
      const references = [channel.heroImage];
      if (job.scene.expression !== "happy") references.push(channel.expressionsImage);
      await generateImage({ prompt: scenePrompt(job.scene, episode), model: channel.imageModel, references, aspectRatio, out });
      opts.onProgress?.(`image ${job.i + 1}/${episode.scenes.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return files;
}

export async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(
    () => true,
    () => false,
  );
}
