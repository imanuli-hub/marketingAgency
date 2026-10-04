import fs from "fs/promises";
import path from "path";

const API = "https://api.elevenlabs.io/v1";

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set in .env");
  return key;
}

export interface VoiceSettings {
  /** Higher = steadier, flatter delivery. */
  stability: number;
  similarity_boost: number;
  /** Expressiveness; keep low for toddlers. */
  style: number;
  /** 0.7–1.2; below 1 is slower. */
  speed: number;
}

// Eleven v3 is far more natural than v2. Its stability only takes 0 (creative),
// 0.5 (natural) or 1 (robust); very steady, slow settings sound robotic.
export const TTS_MODEL = "eleven_v3";

export const VOICE_PRESETS: Record<"day" | "bedtime", VoiceSettings> = {
  day: { stability: 0.5, similarity_boost: 0.8, style: 0, speed: 1 },
  bedtime: { stability: 0.5, similarity_boost: 0.8, style: 0, speed: 1 },
};

/** Text to speech. Writes an MP3 to `out` and returns its path. */
export async function textToSpeech(opts: {
  text: string;
  voiceId: string;
  settings: VoiceSettings;
  out: string;
}): Promise<string> {
  const res = await fetch(`${API}/text-to-speech/${opts.voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({
      text: opts.text,
      model_id: TTS_MODEL,
      voice_settings: { ...opts.settings, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.writeFile(opts.out, Buffer.from(await res.arrayBuffer()));
  return opts.out;
}

async function upload(file: string, field: string, extra: Record<string, string>): Promise<FormData> {
  const form = new FormData();
  form.append(field, new Blob([await fs.readFile(file)], { type: "audio/mpeg" }), path.basename(file));
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return form;
}

/**
 * Voice Changer: re-voices a performance in another voice, keeping its exact
 * timing (so lip movement still matches). Background noise is removed.
 */
export async function speechToSpeech(opts: { input: string; voiceId: string; out: string }): Promise<string> {
  const form = await upload(opts.input, "audio", {
    model_id: "eleven_multilingual_sts_v2",
    remove_background_noise: "true",
  });
  const res = await fetch(`${API}/speech-to-speech/${opts.voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey() },
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs voice changer ${res.status}: ${(await res.text()).slice(0, 300)}`);
  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.writeFile(opts.out, Buffer.from(await res.arrayBuffer()));
  return opts.out;
}

/** Speech to text, used to check that a generated clip says the scripted line. */
export async function transcribe(file: string): Promise<string> {
  const res = await fetch(`${API}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": apiKey() },
    body: await upload(file, "file", { model_id: "scribe_v1" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs speech-to-text ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return ((await res.json()) as { text: string }).text;
}
