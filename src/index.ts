import readline from "readline/promises";
import { Orchestrator } from "./agents/orchestrator.js";
import { listClients } from "./tools/workspace.js";

const [slug, ...rest] = process.argv.slice(2);

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  const clients = await listClients();
  console.log(`Usage: npm start -- <client-slug> ["request"]

  client-slug   lowercase letters, numbers and dashes, e.g. jane-fitness
  request       optional; omit it to start an interactive session

Existing clients: ${clients.length ? clients.join(", ") : "(none yet)"}`);
  process.exit(1);
}

const director = new Orchestrator(slug);

async function handle(request: string): Promise<boolean> {
  console.log("\nAgency Director is working...");
  try {
    const reply = await director.send(request);
    console.log(`\n${reply}\n`);
    return true;
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    return false;
  }
}

if (rest.length) {
  process.exitCode = (await handle(rest.join(" "))) ? 0 : 1;
} else {
  console.log(`Agency session for "${slug}". Type a request, or "exit" to quit.`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  while (true) {
    const line = (await rl.question("> ")).trim();
    if (!line) continue;
    if (line === "exit" || line === "quit") break;
    await handle(line);
  }
  rl.close();
}
