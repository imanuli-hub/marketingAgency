import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChannelConfig, Manifest } from "../src/channel/manifest.js";
import { budgetVerdict, costRows, lintEpisode, nextSlots, reportEpisodes, spendTotals, uploadBlocker, type Spend } from "../src/channel/rules.js";

const cfg = {
  name: "t",
  phase: "testing",
  autoPublish: false,
  videosPerDay: 3,
  budget: { dailyCredits: 40, monthlyCredits: 600, perVideoCredits: 45, maxRetriesPerAsset: 1, stopIfBalanceBelow: 100 },
  publishing: { timezone: "UTC", slots: ["13:00", "17:00", "21:00"], privacyUntilPublish: "private", categoryId: "28", madeForKids: false, containsSyntheticMedia: true, defaultTags: [] },
} satisfies ChannelConfig;

const now = new Date("2026-11-05T10:00:00Z");
const spend = (at: string, credits: number, episode = "e1", model = "m"): Spend => ({ at, episode, item: "x", model, credits });

test("spendTotals splits day and month", () => {
  const t = spendTotals([spend("2026-11-05T01:00:00Z", 10), spend("2026-11-01T01:00:00Z", 5), spend("2026-10-31T01:00:00Z", 99)], now);
  assert.deepEqual(t, { day: 10, month: 15 });
});

test("budget blocks when a cap would be exceeded, allows exactly at the cap", () => {
  const ledger = [spend("2026-11-05T01:00:00Z", 30)];
  assert.equal(budgetVerdict(cfg, ledger, 10, 0, now).ok, true);
  const v = budgetVerdict(cfg, ledger, 10.01, 0, now);
  assert.equal(v.ok, false);
  assert.match(v.reasons[0], /daily cap/);
  assert.match(budgetVerdict(cfg, [], 6, 40, now).reasons.join(), /per-video cap/);
  assert.match(budgetVerdict(cfg, [spend("2026-11-02T01:00:00Z", 595)], 6, 0, now).reasons.join(), /monthly cap/);
});

test("nextSlots skips taken slots and anything within 2 h", () => {
  const slots = nextSlots(cfg, new Set(["2026-11-05T13:00:00Z"]), 3, new Date("2026-11-05T12:00:00Z"));
  assert.deepEqual(slots, ["2026-11-05T17:00:00Z", "2026-11-05T21:00:00Z", "2026-11-06T13:00:00Z"]);
});

test("nextSlots refuses non-UTC timezones", () => {
  assert.throws(() => nextSlots({ ...cfg, publishing: { ...cfg.publishing, timezone: "Europe/Berlin" } }, new Set(), 1));
});

const base = {
  id: "2026-11-05-a-x", status: "qc_passed", approval: { state: "pending" },
  render: { url: "https://x/y.mp4" }, metadata: { title: "t", description: "d", tags: [] },
} as unknown as Manifest;

test("uploadBlocker requires owner approval unless autoPublish", () => {
  assert.equal(uploadBlocker(base, false), "awaiting owner approval");
  assert.equal(uploadBlocker(base, true), null);
  assert.equal(uploadBlocker({ ...base, approval: { state: "approved" } }, false), null);
});

test("uploadBlocker never re-uploads, never uploads rejected or unfinished", () => {
  const ok = { ...base, approval: { state: "approved" } } as Manifest;
  assert.equal(uploadBlocker({ ...ok, youtube: { videoId: "abc" } }, true), "already uploaded");
  assert.equal(uploadBlocker({ ...base, approval: { state: "rejected" } } as Manifest, true), "rejected");
  assert.equal(uploadBlocker({ ...ok, status: "rendered" }, true), "status rendered");
  assert.equal(uploadBlocker({ ...ok, render: undefined }, true), "no render url");
  assert.equal(uploadBlocker({ ...ok, metadata: undefined }, true), "no metadata");
});

test("costRows totals credits and paid calls per video and model", () => {
  const rows = costRows(
    [spend("2026-11-04T01:00:00Z", 2.99, "e1", "elevenlabs_v4"), spend("2026-11-04T01:00:00Z", 6.25, "e1", "kling"), spend("2026-11-04T01:00:00Z", 6.25, "e1", "kling")],
    [{ id: "e1", status: "qc_passed" }, { id: "e2", status: "planned" }],
  );
  assert.equal(rows[0].credits, 15.49);
  assert.equal(rows[0].attempts, 3);
  assert.deepEqual(rows[0].byModel.kling, { credits: 12.5, calls: 2 });
  assert.equal(rows[1].credits, 0);
});

test("lintEpisode catches long scripts, mismatched dialogue, wrong narrator, bad titles", () => {
  const rules = { maxWords: 10, narrators: { photoreal: { name: "A" }, cartoon: { name: "D" } } };
  const good = {
    status: "fact_checked",
    storyboard: [{ n: 1, narration: "Try this now.", style: "photoreal", voice: "A" }, { n: 2, narration: "Nothing, right?", style: "cartoon", voice: "D" }],
    script: { voiceText: "", words: 5, estSeconds: 3, dialogue: [{ voice: "A", voiceId: "a", text: "[deep] Try this now." }, { voice: "D", voiceId: "d", text: "[playful] Nothing, right?" }] },
    factCheck: { verdict: "pass", claims: [{ claim: "c", source: "s" }] },
    metadata: { title: "Why? #shorts", description: "", tags: [] },
  } as unknown as Manifest;
  assert.deepEqual(lintEpisode(good, rules), []);
  const errs = lintEpisode({
    ...good,
    storyboard: [{ ...good.storyboard[0], voice: "D", narration: "one two three four five six seven eight nine ten eleven" }, good.storyboard[1]],
    metadata: { title: "No hashtag", description: "", tags: [] },
  } as Manifest, rules).join("\n");
  assert.match(errs, /words > max/);
  assert.match(errs, /does not match storyboard/);
  assert.match(errs, /must be voiced by A/);
  assert.match(errs, /#shorts/);
  assert.deepEqual(lintEpisode({ ...good, status: "qc_passed", metadata: undefined } as Manifest, rules), []);
});

test("reportEpisodes keeps unfinished work and the day's episodes", () => {
  const eps = [
    { id: "2026-11-05-a-x", createdAt: "2026-11-04T21:00:00Z", status: "qc_passed" },
    { id: "2026-11-01-a-old", createdAt: "2026-11-01T00:00:00Z", status: "published" },
    { id: "2026-11-04-b-y", createdAt: "2026-11-04T00:00:00Z", status: "published" },
  ];
  assert.deepEqual(reportEpisodes(eps, "2026-11-04").map((e) => e.id), ["2026-11-05-a-x", "2026-11-04-b-y"]);
});
