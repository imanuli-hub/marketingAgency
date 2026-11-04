import fs from "fs/promises";

/**
 * Minimal YouTube Data/Analytics API client over fetch (no SDK).
 * Credentials come only from environment variables (GitHub Actions secrets):
 *   YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
 * Nothing secret is ever written to disk or logs.
 */

export const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function hasCredentials(): boolean {
  return ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"].every((k) => process.env[k]?.trim());
}

let cached: { token: string; expires: number } | undefined;

export async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("YT_CLIENT_ID"),
      client_secret: env("YT_CLIENT_SECRET"),
      refresh_token: env("YT_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  const body = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`OAuth refresh failed: ${body.error ?? res.status} ${body.error_description ?? ""}`);
  cached = { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cached.token;
}

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { authorization: `Bearer ${await accessToken()}`, ...(init.headers ?? {}) },
    });
    if (res.ok) return (await res.json()) as T;
    const text = (await res.text()).slice(0, 500);
    // Retry only transient errors, at most 3 attempts.
    if ((res.status >= 500 || res.status === 429) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new Error(`YouTube API ${res.status}: ${text}`);
  }
}

const DATA = "https://www.googleapis.com/youtube/v3";

export interface VideoResource {
  id: string;
  snippet?: { title: string; description: string; tags?: string[]; publishedAt?: string };
  status?: { uploadStatus?: string; privacyStatus?: string; publishAt?: string; rejectionReason?: string; failureReason?: string };
}

/** IDs of the channel's most recent uploads (newest first, up to 50). */
export async function recentUploadIds(): Promise<string[]> {
  const ch = await api<{ items: { contentDetails: { relatedPlaylists: { uploads: string } } }[] }>(
    `${DATA}/channels?part=contentDetails&mine=true`,
  );
  const uploads = ch.items?.[0]?.contentDetails.relatedPlaylists.uploads;
  if (!uploads) throw new Error("No channel found for these credentials");
  const pl = await api<{ items?: { contentDetails: { videoId: string } }[] }>(
    `${DATA}/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}`,
  );
  return (pl.items ?? []).map((i) => i.contentDetails.videoId);
}

export async function getVideos(ids: string[]): Promise<VideoResource[]> {
  if (!ids.length) return [];
  const out: VideoResource[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api<{ items?: VideoResource[] }>(`${DATA}/videos?part=snippet,status&id=${ids.slice(i, i + 50).join(",")}`);
    out.push(...(r.items ?? []));
  }
  return out;
}

export interface UploadRequest {
  file: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  publishAt: string; // ISO; video stays private until then
  madeForKids: boolean;
  containsSyntheticMedia: boolean;
}

/** Resumable upload. Returns the new video resource. */
export async function uploadVideo(req: UploadRequest): Promise<VideoResource> {
  const bytes = await fs.readFile(req.file);
  const metadata = {
    snippet: { title: req.title, description: req.description, tags: req.tags, categoryId: req.categoryId, defaultLanguage: "en", defaultAudioLanguage: "en" },
    status: {
      privacyStatus: "private",
      publishAt: req.publishAt,
      selfDeclaredMadeForKids: req.madeForKids,
      containsSyntheticMedia: req.containsSyntheticMedia,
      embeddable: true,
    },
  };
  const init = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${await accessToken()}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-type": "video/mp4",
      "x-upload-content-length": String(bytes.length),
    },
    body: JSON.stringify(metadata),
  });
  const location = init.headers.get("location");
  if (!init.ok || !location) throw new Error(`Upload session failed ${init.status}: ${(await init.text()).slice(0, 400)}`);
  const put = await fetch(location, {
    method: "PUT",
    headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "video/mp4", "content-length": String(bytes.length) },
    body: bytes,
  });
  if (!put.ok) throw new Error(`Upload failed ${put.status}: ${(await put.text()).slice(0, 400)}`);
  return (await put.json()) as VideoResource;
}

const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";

export interface Report {
  columnHeaders: { name: string }[];
  rows?: (string | number)[][];
}

export async function analyticsReport(params: Record<string, string>): Promise<Report> {
  const q = new URLSearchParams({ ids: "channel==MINE", ...params });
  return api<Report>(`${ANALYTICS}?${q}`);
}

export function rowsToObjects(r: Report): Record<string, string | number>[] {
  const names = r.columnHeaders.map((h) => h.name);
  return (r.rows ?? []).map((row) => Object.fromEntries(row.map((v, i) => [names[i], v])));
}
