import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { loadQueue } from "../src/channel/manifest.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = "_test_queue";
const tmpDir = path.join(ROOT, "channels", TMP);

test("every real episode manifest matches the schema", async () => {
  const q = await loadQueue("invisible-explained");
  assert.ok(q.length >= 1);
  for (const { m } of q) assert.ok(m.credits.spent <= m.credits.estimated + 15, `${m.id} far over estimate`);
});

// End-to-end CLI flow on a throwaway copy: approval gate → slots → publish dry-run.
test("approve → assign-slots → publish dry-run (no network, no credentials)", () => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, "channels", "invisible-explained"), tmpDir, { recursive: true });
  fs.rmSync(path.join(tmpDir, "ledger", "credits.jsonl"), { force: true });
  const file = fs.readdirSync(path.join(tmpDir, "queue")).find((f) => f.endsWith(".json"))!;
  const m = JSON.parse(fs.readFileSync(path.join(tmpDir, "queue", file), "utf8"));
  Object.assign(m, { status: "qc_passed", approval: { state: "pending" }, schedule: undefined, youtube: undefined });
  fs.writeFileSync(path.join(tmpDir, "queue", file), JSON.stringify(m));

  const env = { ...process.env, CHANNEL: TMP, YT_CLIENT_ID: "", YT_CLIENT_SECRET: "", YT_REFRESH_TOKEN: "" };
  const run = (script: string, ...args: string[]) =>
    execFileSync("npx", ["tsx", script, ...args], { cwd: ROOT, env, encoding: "utf8" });

  assert.match(run("src/youtube/publish.ts", "--dry-run"), /awaiting owner approval/);
  assert.match(run("src/channel/cli.ts", "approve", m.id), /approval:approved/);
  assert.match(run("src/channel/cli.ts", "assign-slots"), /@\d{4}-\d{2}-\d{2}T\d{2}:00:00Z/);
  assert.match(run("src/youtube/publish.ts", "--dry-run"), /DRY RUN would upload/);
  assert.match(run("src/youtube/publish.ts"), /credentials not configured/);
  run("src/channel/cli.ts", "budget-record", m.id, "voice", "elevenlabs_v4", "2.99", "job1");
  assert.match(run("src/channel/cli.ts", "costs"), /\| 2\.99 \| 1 \| elevenlabs_v4 2\.99 \(1\)/);
});

after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
