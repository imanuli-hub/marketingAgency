import fs from "fs/promises";
import path from "path";
import { episodeDir, EpisodeSchema, loadChannel, type Episode } from "./production/episode.js";
import { textToSpeech, VOICE_PRESETS } from "./production/elevenlabs.js";
import { exists, generateClip, generateSceneImages, motionPrompt } from "./production/images.js";
import { writeScript } from "./production/script.js";
import { concatScenes, durationOf, renderClipScene, renderScene, sceneLength, SIZES } from "./production/video.js";

const USAGE = `Usage: npm run episode -- <client> <episode-slug> [short|long] ["idea"] [--only script]

  Runs script -> voice -> images -> video for one episode, skipping any step
  whose files already exist. Output: clients/<client>/episodes/<episode-slug>/

  --only script   stop after writing the script so you can review it first

Example:
  npm run episode -- hello-emil ep001-goodnight-lantern short "Emil says goodnight to the moon"`;

const args = process.argv.slice(2);
const onlyScript = args.includes("--only") && args[args.indexOf("--only") + 1] === "script";
const positional = args.filter((a, i) => a !== "--only" && args[i - 1] !== "--only");
const [slug, episodeSlug, formatArg, ...ideaWords] = positional;

if (!slug || !episodeSlug) {
  console.log(USAGE);
  process.exit(1);
}

const dir = episodeDir(slug, episodeSlug);
const scriptFile = path.join(dir, "script.json");
const log = (msg: string) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

async function loadOrWriteScript(): Promise<Episode> {
  if (await exists(scriptFile)) {
    log("script: using existing script.json");
    return EpisodeSchema.parse(JSON.parse(await fs.readFile(scriptFile, "utf8")));
  }
  const format = formatArg === "long" ? "long" : "short";
  const idea = ideaWords.join(" ");
  if (!idea) throw new Error("No script yet, so an idea is required.");
  log(`script: writing a ${format} episode...`);
  const episode = await writeScript({ slug, idea, format });
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(scriptFile, JSON.stringify(episode, null, 2));
  return episode;
}

try {
  const channel = await loadChannel(slug);
  const episode = await loadOrWriteScript();
  log(`script: "${episode.title}" (${episode.type}, ${episode.format}, ${episode.scenes.length} scenes)`);
  if (onlyScript) {
    console.log(`\nReview ${scriptFile}, then run the same command without --only script.`);
    process.exit(0);
  }

  // Voice
  const audio: string[] = [];
  for (const [i, scene] of episode.scenes.entries()) {
    const out = path.join(dir, "audio", `scene-${String(i + 1).padStart(2, "0")}.mp3`);
    audio.push(out);
    if (await exists(out)) continue;
    await textToSpeech({ text: scene.narration, voiceId: channel.narratorVoiceId, settings: VOICE_PRESETS[episode.lighting], out });
  }
  log(`voice: ${audio.length} narration clips ready`);

  // Images
  const images = await generateSceneImages({ episode, channel, dir: path.join(dir, "images"), onProgress: (m) => log(m) });
  log(`images: ${images.length} ready`);

  // Animation: each scene image becomes a clip as long as its narration.
  const anims: (string | undefined)[] = [];
  if (channel.videoModel) {
    const jobs = episode.scenes.map((scene, i) => ({ scene, i }));
    let done = 0;
    const worker = async () => {
      for (let job = jobs.shift(); job; job = jobs.shift()) {
        const out = path.join(dir, "anim", `scene-${String(job.i + 1).padStart(2, "0")}.mp4`);
        anims[job.i] = out;
        if (await exists(out)) continue;
        const seconds = Math.min(15, Math.ceil(await sceneLength(audio[job.i], job.scene.pause_after)));
        await generateClip({
          prompt: motionPrompt(job.scene),
          model: channel.videoModel!,
          image: images[job.i],
          seconds,
          resolution: channel.videoResolution,
          out,
        });
        log(`animation ${++done}/${episode.scenes.length}`);
      }
    };
    // OpenArt's Starter plan allows two generations at a time.
    await Promise.all([worker(), worker()]);
    log(`animation: ${anims.length} clips ready`);
  }

  // Video
  const size = SIZES[episode.format];
  const clips: string[] = [];
  for (const [i, scene] of episode.scenes.entries()) {
    const out = path.join(dir, "clips", `scene-${String(i + 1).padStart(2, "0")}.mp4`);
    clips.push(out);
    if (await exists(out)) continue;
    await fs.mkdir(path.dirname(out), { recursive: true });
    const anim = anims[i];
    if (anim) await renderClipScene({ clip: anim, audio: audio[i], pauseAfter: scene.pause_after, size, out });
    else await renderScene({ image: images[i], audio: audio[i], pauseAfter: scene.pause_after, index: i, size, out });
  }
  const final = path.join(dir, `${episodeSlug}.mp4`);
  await concatScenes(clips, final);
  log(`video: ${final} (${(await durationOf(final)).toFixed(1)} s)`);
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
}
