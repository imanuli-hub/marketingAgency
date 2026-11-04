import http from "http";
import { SCOPES } from "./api.js";

/**
 * One-time setup, run on YOUR computer (not in CI):
 *   YT_CLIENT_ID=... YT_CLIENT_SECRET=... npm run yt:auth
 * Open the printed URL, sign in with the account that owns the channel, allow
 * access. The refresh token is printed once; store it as the GitHub secret
 * YT_REFRESH_TOKEN and nowhere else.
 */

const PORT = 8765;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const clientId = process.env.YT_CLIENT_ID?.trim();
const clientSecret = process.env.YT_CLIENT_SECRET?.trim();
if (!clientId || !clientSecret) {
  console.error("Set YT_CLIENT_ID and YT_CLIENT_SECRET (OAuth client of type 'Desktop app').");
  process.exit(1);
}

const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
url.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPES.join(" "),
  access_type: "offline",
  prompt: "consent",
}).toString();

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", REDIRECT);
  if (u.pathname !== "/callback") return void res.writeHead(404).end();
  const code = u.searchParams.get("code");
  if (!code) return void res.writeHead(400).end(`Authorization failed: ${u.searchParams.get("error") ?? "no code"}`);
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
  }).then((r) => r.json() as Promise<{ refresh_token?: string; error?: string }>);
  res.writeHead(200, { "content-type": "text/plain" }).end(tok.refresh_token ? "Done. Return to the terminal." : `Failed: ${tok.error}`);
  if (tok.refresh_token) {
    console.log("\nRefresh token (save as GitHub secret YT_REFRESH_TOKEN, then clear your terminal):\n");
    console.log(tok.refresh_token);
  } else console.error(`Token exchange failed: ${tok.error}`);
  server.close();
});

server.listen(PORT, "127.0.0.1", () => console.log(`Open this URL and allow access:\n\n${url}\n`));
