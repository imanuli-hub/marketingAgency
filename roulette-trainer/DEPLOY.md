# Deploying Roulette Academy to Vercel (free Hobby plan)

The app is fully static/client-side: no database, no API keys, no environment variables. Vercel builds it straight from GitHub; nothing needs to be installed on your computer.

## One-time setup (≈5 minutes, in a browser)

1. **Sign in** at https://vercel.com with your GitHub account (Hobby plan, free; no card needed).
2. **Import the repository**: *Add New… → Project → Import* `imanuli-hub/marketingAgency`.
   If the repository isn't listed, choose *Adjust GitHub App Permissions* and give the Vercel app access to it.
3. On the configuration screen:
   - **Root Directory → Edit → `roulette-trainer`** (this is what keeps the unrelated project out of the deployment).
   - Framework Preset: **Next.js** (detected automatically).
   - Build/Install commands: leave the defaults (they come from `roulette-trainer/vercel.json`).
   - **Environment Variables: none.** Don't add any.
4. Click **Deploy**. Vercel deploys the repository's default branch (`main`) first. `main` doesn't contain `roulette-trainer/` yet, so this first build is expected to fail. That's fine.
5. **Point production at the training branch**: *Project → Settings → Environments → Production → Branch Tracking* → set the branch to `claude/roulette-training-simulator-hcxgwu` → Save.
6. **Deploy that branch**: *Deployments → Create Deployment* (or open the latest deployment of that branch → *Redeploy*) and choose `claude/roulette-training-simulator-hcxgwu`.
7. When it shows **Ready**, your public URL is `https://<project-name>.vercel.app` (shown on the project page). HTTPS is automatic.

Every later push to that branch redeploys automatically. Pushes that change only the other project are skipped (`ignoreCommand` in `vercel.json`).

> Preview URLs (per-commit) may ask for a Vercel login because of Vercel's default Deployment Protection. Use the **production** `.vercel.app` domain on your phone; it is public.

## Install on iPhone

1. Open the production URL in **Safari** (not Chrome; only Safari can add web apps to the Home Screen on iOS).
2. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
3. Launch it from the new icon. It opens full-screen without browser bars, in Hebrew by default.

Notes:
- Your progress (bankroll, sessions, lessons) is stored **on the phone only**. The Home Screen app keeps its own storage, separate from Safari tabs, so do your training from the icon.
- After one online visit, the app also works **offline**.
- Back up from *Settings → Export JSON* if you ever plan to remove the app or reset the phone.

## What was verified before deploying
`npm ci` · 117 unit tests · TypeScript · ESLint · production build · security and service-worker headers · manifest and icons · service-worker registration and offline reload · 30 browser checks (Hebrew RTL / English, desktop, iPhone SE, iPhone 14 portrait and landscape, bet → spin → settlement, stop rules, rehearsal, guided mode, persistence across reload) · simulator Web Worker.
