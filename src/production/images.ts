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

/** Character ids shown in a scene (speaker first); defaults to Emil alone. */
export function sceneCast(scene: Scene, channel: Channel): string[] {
  const known = (id: string) => id in channel.characters;
  const cast = (scene.characters ?? []).filter(known);
  if (scene.speaker && known(scene.speaker) && !cast.includes(scene.speaker)) cast.unshift(scene.speaker);
  return cast.length ? cast : ["emil"];
}

/** True when a cast character (not the narrator) speaks the scene's line. */
export function isTalkScene(scene: Scene, channel: Channel): boolean {
  return Boolean(scene.speaker && scene.speaker in channel.characters && channel.talkModel);
}

export function scenePrompt(scene: Scene, episode: Episode, channel?: Channel): string {
  const cast = channel ? sceneCast(scene, channel) : ["emil"];
  if (!channel || Object.keys(channel.characters).length === 0) {
    return `Using the character in the reference image exactly (same design, colors, proportions, curl, ears, lantern, materials and 3D style), show Emil: ${scene.visual} His expression: ${scene.expression}. ${LIGHTING[episode.lighting]} ${STYLE}`;
  }
  const who = cast
    .map((id, i) => `${channel.characters[id].name} (reference image ${i + 1}: ${channel.characters[id].look ?? ""})`)
    .join("; ");
  const framing = isTalkScene(scene, channel)
    ? `Close-up, head and shoulders, of ${channel.characters[scene.speaker!].name} facing the camera at a slight angle, mouth clearly visible and closed, ready to speak.`
    : "";
  const emilMood = cast.includes("emil") ? ` Emil's expression: ${scene.expression}.` : "";
  return `Show these characters exactly as in their reference images (same design, colors, proportions, materials and 3D style; do not mix their features): ${who}. ${framing} Scene: ${scene.visual}${emilMood} ${LIGHTING[episode.lighting]} ${STYLE}`;
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

const CONTINUITY =
  "The last reference image is the previous scene: keep the same room, furniture, windows, sky and lighting as in it, unless this scene clearly moves to a new place.";

/**
 * One image per scene, skipping scenes whose image already exists. Scenes are
 * generated in order, each with the previous scene's image as an extra
 * reference so locations stay consistent.
 */
export async function generateSceneImages(opts: {
  episode: Episode;
  channel: Channel;
  dir: string;
  onProgress?: (msg: string) => void;
}): Promise<string[]> {
  const { episode, channel, dir } = opts;
  const aspectRatio = episode.format === "short" ? "9:16" : "16:9";
  const files: string[] = [];

  for (const [i, scene] of episode.scenes.entries()) {
    const out = path.join(dir, `scene-${String(i + 1).padStart(2, "0")}.png`);
    files.push(out);
    if (await exists(out)) continue;
    const cast = Object.keys(channel.characters).length ? sceneCast(scene, channel) : ["emil"];
    const references = cast.map((id) => channel.characters[id]?.image ?? channel.heroImage);
    if (cast.includes("emil") && scene.expression !== "happy" && cast.length < 3) references.push(channel.expressionsImage);
    let prompt = scenePrompt(scene, episode, channel);
    if (i > 0) {
      references.push(files[i - 1]);
      prompt += ` ${CONTINUITY}`;
    }
    await generateImage({ prompt, model: channel.imageModel, references, aspectRatio, out });
    opts.onProgress?.(`image ${i + 1}/${episode.scenes.length}`);
  }
  return files;
}

export async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(
    () => true,
    () => false,
  );
}

const MOTION_STYLE =
  "Gentle, slow animation for toddlers. Static or very slow camera, smooth calm motion, no sudden movements, no scene cuts. Keep the character, colors and setting exactly as in the image.";

export function motionPrompt(scene: Scene): string {
  return `${scene.motion ?? `Emil moves gently: ${scene.visual}`} ${MOTION_STYLE}`;
}

/** Animates a start-frame image into a clip with OpenArt image-to-video. */
export async function generateClip(opts: {
  prompt: string;
  model: string;
  image: string;
  seconds: number;
  resolution?: string;
  aspectRatio?: string;
  out: string;
}): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "openart-"));
  const args = ["generate", "video", opts.prompt, "--model", opts.model, "--image", opts.image];
  args.push("--duration", String(opts.seconds), "-o", tmp, "--quiet", "--no-input");
  if (opts.resolution) args.push("--resolution", opts.resolution);
  if (opts.aspectRatio) args.push("--aspect-ratio", opts.aspectRatio);
  try {
    await run(OPENART, args, { timeout: 10 * 60_000 });
  } catch (err) {
    const e = err as { stderr?: string; message: string };
    throw new Error(`OpenArt video failed: ${(e.stderr || e.message).trim().slice(0, 300)}`);
  }
  const [file] = (await fs.readdir(tmp)).filter((f) => /\.(mp4|mov|webm)$/i.test(f));
  if (!file) throw new Error("OpenArt returned no video");
  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.copyFile(path.join(tmp, file), opts.out);
  await fs.rm(tmp, { recursive: true, force: true });
  return opts.out;
}
