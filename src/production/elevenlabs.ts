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

export const VOICE_PRESETS: Record<"day" | "bedtime", VoiceSettings> = {
  day: { stability: 0.6, similarity_boost: 0.8, style: 0.2, speed: 0.95 },
  bedtime: { stability: 0.75, similarity_boost: 0.8, style: 0.05, speed: 0.88 },
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
      model_id: "eleven_multilingual_v2",
      voice_settings: { ...opts.settings, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.writeFile(opts.out, Buffer.from(await res.arrayBuffer()));
  return opts.out;
}
