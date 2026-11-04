import type { ChannelConfig, Manifest } from "./manifest.js";

/**
 * Why an episode may NOT be uploaded yet, or null when it may. The single
 * gate for the publisher: approval is required unless the owner has switched
 * the channel to production with autoPublish (passed in as `autoPublish`).
 */
export function uploadBlocker(m: Manifest, autoPublish: boolean): string | null {
  if (m.youtube?.videoId) return "already uploaded";
  if (m.status !== "qc_passed") return `status ${m.status}`;
  if (m.approval.state === "rejected") return "rejected";
  if (m.approval.state !== "approved" && !autoPublish) return "awaiting owner approval";
  if (!m.render?.url) return "no render url";
  if (!m.metadata) return "no metadata";
  return null;
}

export interface Spend {
  at: string;
  episode: string;
  item: string;
  model: string;
  credits: number;
  jobId?: string;
}

export function spendTotals(ledger: Spend[], now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const sum = (f: (s: Spend) => boolean) => ledger.filter(f).reduce((a, s) => a + s.credits, 0);
  return { day: sum((s) => s.at.startsWith(day)), month: sum((s) => s.at.startsWith(month)) };
}

export function budgetVerdict(
  cfg: ChannelConfig,
  ledger: Spend[],
  credits: number,
  episodeSpent = 0,
  now = new Date(),
): { ok: boolean; reasons: string[] } {
  const t = spendTotals(ledger, now);
  const reasons: string[] = [];
  if (t.day + credits > cfg.budget.dailyCredits) reasons.push(`daily cap ${cfg.budget.dailyCredits} (spent ${t.day.toFixed(2)})`);
  if (t.month + credits > cfg.budget.monthlyCredits) reasons.push(`monthly cap ${cfg.budget.monthlyCredits} (spent ${t.month.toFixed(2)})`);
  if (episodeSpent + credits > cfg.budget.perVideoCredits) reasons.push(`per-video cap ${cfg.budget.perVideoCredits} (spent ${episodeSpent.toFixed(2)})`);
  return { ok: reasons.length === 0, reasons };
}

export interface LintRules {
  maxWords: number;
  narrators: Record<string, { name: string }>; // style -> narrator
}

const PAID_DONE = new Set(["assets_ready", "rendered", "qc_passed", "uploaded", "published", "rejected", "failed"]);

/**
 * Problems that must be fixed before an episode may spend credits. Only
 * episodes that have not generated assets yet are checked strictly.
 */
export function lintEpisode(m: Manifest, rules: LintRules): string[] {
  if (PAID_DONE.has(m.status)) return [];
  const errs: string[] = [];
  const words = m.storyboard.reduce((a, s) => a + s.narration.split(/\s+/).filter(Boolean).length, 0);
  if (!m.script) errs.push("no script");
  if (words > rules.maxWords) errs.push(`${words} words > max ${rules.maxWords} (too long for 45 s)`);
  if (m.factCheck?.verdict !== "pass") errs.push(`fact-check ${m.factCheck?.verdict ?? "missing"}`);
  if (!m.factCheck?.claims.length) errs.push("no sourced claims");
  for (const c of m.factCheck?.claims ?? []) if (!c.source.trim()) errs.push(`claim without source: ${c.claim.slice(0, 40)}`);
  const t = m.metadata?.title ?? "";
  if (!t) errs.push("no title");
  else if (t.length > 70 || !/#shorts$/i.test(t)) errs.push("title must be ≤ 70 chars and end with #shorts");
  if (m.script?.dialogue) {
    const spoken = m.script.dialogue.map((d) => d.text.replace(/\[[^\]]*\]\s*/g, "")).join(" ").replace(/\s+/g, " ").trim();
    const board = m.storyboard.map((s) => s.narration).join(" ").replace(/\s+/g, " ").trim();
    if (spoken !== board) errs.push("dialogue text does not match storyboard narration");
    for (const s of m.storyboard) {
      const want = s.style ? rules.narrators[s.style]?.name : undefined;
      if (want && s.voice !== want) errs.push(`scene ${s.n}: ${s.style} scene must be voiced by ${want}`);
    }
    const seen = new Set<string>();
    for (const d of m.script.dialogue) {
      const tagged = d.text.trimStart().startsWith("[");
      if (!seen.has(d.voice) && !tagged) errs.push(`${d.voice}'s first turn needs its delivery direction`);
      seen.add(d.voice);
    }
  }
  return errs;
}

export interface CostRow {
  episode: string;
  status: string;
  credits: number;
  attempts: number;
  byModel: Record<string, { credits: number; calls: number }>;
}

/**
 * Production cost log per video from the credit ledger: credits, number of
 * paid generation calls (attempts) and the split by model. Episodes with no
 * spend are listed with 0.
 */
export function costRows(ledger: Spend[], episodes: { id: string; status: string }[]): CostRow[] {
  const rows = new Map<string, CostRow>(
    episodes.map((e) => [e.id, { episode: e.id, status: e.status, credits: 0, attempts: 0, byModel: {} }]),
  );
  for (const s of ledger) {
    const r = rows.get(s.episode) ?? { episode: s.episode, status: "unknown", credits: 0, attempts: 0, byModel: {} };
    r.credits = Math.round((r.credits + s.credits) * 100) / 100;
    r.attempts++;
    const b = (r.byModel[s.model] ??= { credits: 0, calls: 0 });
    b.credits = Math.round((b.credits + s.credits) * 100) / 100;
    b.calls++;
    rows.set(s.episode, r);
  }
  return [...rows.values()];
}

/** Episodes a daily report should list: created/active on `date`, or not yet finished. */
export function reportEpisodes<T extends { id: string; createdAt: string; status: string }>(eps: T[], date: string): T[] {
  const done = new Set(["published", "rejected"]);
  return eps.filter((e) => e.id.startsWith(date) || e.createdAt.startsWith(date) || !done.has(e.status));
}

/** Next `n` slot datetimes (UTC ISO) from `from`, skipping times already taken. */
export function nextSlots(cfg: ChannelConfig, taken: Set<string>, n: number, from = new Date()): string[] {
  if (cfg.publishing.timezone !== "UTC") throw new Error("Only UTC slots are supported; convert slots to UTC in channel.json");
  const out: string[] = [];
  const minLead = from.getTime() + 2 * 3600_000; // YouTube needs publishAt in the future; keep 2 h margin
  for (let d = 0; out.length < n && d < 60; d++) {
    const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + d));
    for (const slot of cfg.publishing.slots) {
      const [h, mi] = slot.split(":").map(Number);
      const t = new Date(date.getTime() + (h * 60 + mi) * 60_000);
      const iso = t.toISOString().replace(".000Z", "Z");
      if (t.getTime() >= minLead && !taken.has(iso) && out.length < n) out.push(iso);
    }
  }
  return out;
}

