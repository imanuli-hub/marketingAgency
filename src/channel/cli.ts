import fs from "fs/promises";
import path from "path";
import {
  channelDir,
  loadChannelConfig,
  loadQueue,
  logLine,
  saveManifest,
  type Manifest,
} from "./manifest.js";
import { budgetVerdict, nextSlots, spendTotals, type Spend } from "./rules.js";

const USAGE = `Usage: npm run channel -- <command> [args]   (channel: CHANNEL env, default invisible-explained)

  status                         queue overview + credit spend vs budget
  budget-check <credits> [id]    exit 0 if spending <credits> stays within daily/monthly/per-video caps, else exit 2
  budget-record <id> <item> <model> <credits> [jobId]
                                 append a spend to ledger/credits.jsonl and the manifest
  approve <id> [notes]           owner approval: allows upload (only qc_passed episodes)
  reject <id> [notes]            owner rejection: never uploaded
  assign-slots [YYYY-MM-DD]      give approved episodes without a publishAt the next free slots
  report [YYYY-MM-DD]            write reports/<date>.md (compact daily report)`;

const CHANNEL = process.env.CHANNEL ?? "invisible-explained";
const ledgerFile = () => path.join(channelDir(CHANNEL), "ledger", "credits.jsonl");

async function readLedger(): Promise<Spend[]> {
  const text = await fs.readFile(ledgerFile(), "utf8").catch(() => "");
  return text
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Spend);
}

async function find(id: string) {
  const hit = (await loadQueue(CHANNEL)).find((q) => q.m.id === id || q.m.slug === id);
  if (!hit) throw new Error(`No episode "${id}" in queue`);
  return hit;
}

function line(m: Manifest): string {
  const yt = m.youtube?.videoId ? ` yt:${m.youtube.videoId}` : "";
  const at = m.schedule?.publishAt ? ` @${m.schedule.publishAt}` : "";
  return `${m.id.padEnd(34)} ${m.status.padEnd(13)} approval:${m.approval.state.padEnd(8)} ${m.credits.spent.toFixed(2)}/${m.credits.estimated.toFixed(2)} cr${at}${yt}`;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const cfg = await loadChannelConfig(CHANNEL);

  switch (cmd) {
    case "status": {
      const ledger = await readLedger();
      const t = spendTotals(ledger);
      console.log(`${cfg.name} · phase ${cfg.phase} · autoPublish ${cfg.autoPublish}`);
      console.log(`credits today ${t.day.toFixed(2)}/${cfg.budget.dailyCredits} · month ${t.month.toFixed(2)}/${cfg.budget.monthlyCredits}`);
      for (const { m } of await loadQueue(CHANNEL)) console.log(line(m));
      return;
    }
    case "budget-check": {
      const credits = Number(rest[0]);
      if (!Number.isFinite(credits)) throw new Error("budget-check needs a credit amount");
      const spent = rest[1] ? (await find(rest[1])).m.credits.spent : 0;
      const v = budgetVerdict(cfg, await readLedger(), credits, spent);
      console.log(v.ok ? `OK: ${credits} credits within budget` : `BLOCKED: ${v.reasons.join("; ")}`);
      process.exitCode = v.ok ? 0 : 2;
      return;
    }
    case "budget-record": {
      const [id, item, model, credits, jobId] = rest;
      const amount = Number(credits);
      if (!id || !item || !model || !Number.isFinite(amount)) throw new Error("budget-record <id> <item> <model> <credits> [jobId]");
      const { file, m } = await find(id);
      const spend: Spend = { at: new Date().toISOString(), episode: m.id, item, model, credits: amount, ...(jobId ? { jobId } : {}) };
      await fs.mkdir(path.dirname(ledgerFile()), { recursive: true });
      await fs.appendFile(ledgerFile(), JSON.stringify(spend) + "\n");
      m.credits.spent = Math.round((m.credits.spent + amount) * 100) / 100;
      logLine(m, `spent ${amount} cr ${item} (${model})${jobId ? ` job ${jobId}` : ""}`);
      await saveManifest(file, m);
      console.log(`recorded ${amount} cr for ${m.id}; episode total ${m.credits.spent}`);
      return;
    }
    case "approve":
    case "reject": {
      const { file, m } = await find(rest[0] ?? "");
      if (cmd === "approve" && m.status !== "qc_passed") throw new Error(`${m.id} is ${m.status}; only qc_passed episodes can be approved`);
      m.approval = { state: cmd === "approve" ? "approved" : "rejected", by: "owner", at: new Date().toISOString(), notes: rest.slice(1).join(" ") || undefined };
      if (cmd === "reject") m.status = "rejected";
      logLine(m, `${cmd}d by owner`);
      await saveManifest(file, m);
      console.log(line(m));
      return;
    }
    case "assign-slots": {
      const queue = await loadQueue(CHANNEL);
      const taken = new Set(queue.map((q) => q.m.schedule?.publishAt).filter((x): x is string => Boolean(x)));
      const from = rest[0] ? new Date(`${rest[0]}T00:00:00Z`) : new Date();
      const need = queue.filter((q) => q.m.approval.state === "approved" && !q.m.schedule && q.m.status === "qc_passed");
      const slots = nextSlots(cfg, taken, need.length, from);
      for (const [i, q] of need.entries()) {
        q.m.schedule = { publishAt: slots[i] };
        logLine(q.m, `scheduled for ${slots[i]}`);
        await saveManifest(q.file, q.m);
        console.log(line(q.m));
      }
      if (!need.length) console.log("nothing to schedule");
      return;
    }
    case "report": {
      const date = rest[0] ?? new Date().toISOString().slice(0, 10);
      const queue = await loadQueue(CHANNEL);
      const ledger = await readLedger();
      const t = spendTotals(ledger, new Date(`${date}T12:00:00Z`));
      const today = queue.filter((q) => q.m.id.startsWith(date));
      const body = [
        `# ${cfg.name}: daily report ${date}`,
        "",
        `Credits: ${t.day.toFixed(2)} today (cap ${cfg.budget.dailyCredits}) · ${t.month.toFixed(2)} this month (cap ${cfg.budget.monthlyCredits})`,
        "",
        "| Episode | Status | Approval | Credits | Publish at | YouTube |",
        "|---|---|---|---|---|---|",
        ...today.map(({ m }) => `| ${m.id} | ${m.status} | ${m.approval.state} | ${m.credits.spent} | ${m.schedule?.publishAt ?? "-"} | ${m.youtube?.videoId ?? "-"} |`),
        "",
        "## Needs the owner",
        ...queue.filter((q) => q.m.status === "qc_passed" && q.m.approval.state === "pending").map((q) => `- Review and approve or reject: ${q.m.id} ${q.m.render?.url ?? ""}`),
        ...queue.filter((q) => q.m.status === "failed").map((q) => `- Failed: ${q.m.id}: ${q.m.log.at(-1) ?? ""}`),
        "",
      ].join("\n");
      const out = path.join(channelDir(CHANNEL), "reports", `${date}.md`);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, body);
      console.log(body);
      return;
    }
    default:
      console.log(USAGE);
      process.exitCode = cmd ? 1 : 0;
  }
}

main().catch((err) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
});
