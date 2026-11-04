import type { ChannelConfig } from "./manifest.js";

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
): { ok: boolean; reasons: string[] } {
  const t = spendTotals(ledger);
  const reasons: string[] = [];
  if (t.day + credits > cfg.budget.dailyCredits) reasons.push(`daily cap ${cfg.budget.dailyCredits} (spent ${t.day.toFixed(2)})`);
  if (t.month + credits > cfg.budget.monthlyCredits) reasons.push(`monthly cap ${cfg.budget.monthlyCredits} (spent ${t.month.toFixed(2)})`);
  if (episodeSpent + credits > cfg.budget.perVideoCredits) reasons.push(`per-video cap ${cfg.budget.perVideoCredits} (spent ${episodeSpent.toFixed(2)})`);
  return { ok: reasons.length === 0, reasons };
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

