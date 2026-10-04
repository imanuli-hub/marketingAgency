import fs from "fs/promises";
import path from "path";
import { speechToSpeech, transcribe } from "./elevenlabs.js";
import type { Channel, Episode, Scene } from "./episode.js";
import { exists, generateClip, sceneCast } from "./images.js";
import { extractAudio, fitImage, SIZES } from "./video.js";

/** Rough share of the scripted words that the clip actually said (0–1). */
export function wordMatch(script: string, heard: string): number {
  const words = (t: string) => t.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean);
  const want = words(script);
  const got = new Set(words(heard));
  return want.length ? want.filter((w) => got.has(w)).length / want.length : 1;
}

/** Veo clips come in 4, 6 or 8 seconds; leave room after the line. */
function talkSeconds(line: string): number {
  const needed = line.split(/\s+/).length / 2.5 + 1.5;
  return needed <= 4 ? 4 : needed <= 6 ? 6 : 8;
}

function talkPrompt(scene: Scene, channel: Channel): string {
  const speaker = channel.characters[scene.speaker!];
  const others = sceneCast(scene, channel).filter((id) => id !== scene.speaker);
  const quiet = others.length ? ` ${others.map((id) => channel.characters[id].name).join(" and ")} listens quietly and does not speak.` : "";
  return (
    `${speaker.name}, ${speaker.look}, looks toward the camera and says in a soft, warm, friendly cartoon voice: "${scene.narration}" ` +
    `Only ${speaker.name} speaks, with clear speech and the mouth moving in sync with the words.${quiet} ` +
    `${scene.motion ?? ""} No music, no background sounds, no other voices. Gentle, calm motion, static camera. ` +
    `Keep every character exactly as in the image.`
  );
}

/**
 * Makes a talking shot: the speaker says the line with lip-sync (video model),
 * the words are checked with speech-to-text (one retry), and the voice is
 * swapped for the character's own voice with the same timing.
 */
export async function makeTalkScene(opts: {
  scene: Scene;
  episode: Episode;
  channel: Channel;
  image: string;
  dir: string;
  index: number;
  log: (msg: string) => void;
}): Promise<{ clip: string; voice: string }> {
  const { scene, channel } = opts;
  const n = String(opts.index + 1).padStart(2, "0");
  const clip = path.join(opts.dir, "talk", `scene-${n}.mp4`);
  const voice = path.join(opts.dir, "talk", `scene-${n}-voice.mp3`);
  if ((await exists(clip)) && (await exists(voice))) return { clip, voice };

  await fs.mkdir(path.join(opts.dir, "talk"), { recursive: true });
  const size = SIZES[opts.episode.format];
  const aspectRatio = opts.episode.format === "short" ? "9:16" : "16:9";
  const start = await fitImage(opts.image, { w: size.w / 1.5, h: size.h / 1.5 }, path.join(opts.dir, "talk", `scene-${n}-start.png`));

  let heard = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    await generateClip({
      prompt: talkPrompt(scene, channel),
      model: channel.talkModel!,
      image: start,
      seconds: talkSeconds(scene.narration),
      resolution: "720p",
      aspectRatio,
      out: clip,
    });
    const raw = await extractAudio(clip, path.join(opts.dir, "talk", `scene-${n}-raw.mp3`));
    heard = await transcribe(raw);
    const match = wordMatch(scene.narration, heard);
    if (match >= 0.6) {
      await speechToSpeech({ input: raw, voiceId: channel.characters[scene.speaker!].voiceId, out: voice });
      opts.log(`talk ${n}: ${channel.characters[scene.speaker!].name} said ${Math.round(match * 100)}% of the line`);
      return { clip, voice };
    }
    opts.log(`talk ${n}: heard "${heard}" (${Math.round(match * 100)}% match), ${attempt === 1 ? "retrying" : "giving up"}`);
  }
  throw new Error(`Scene ${n}: the clip did not say the line. Heard: "${heard}"`);
}
