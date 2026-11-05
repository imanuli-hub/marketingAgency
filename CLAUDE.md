# Project instructions: The Invisible Explained

This repo runs the AI production and publishing system for the YouTube Shorts channel **The Invisible Explained** (it also holds an older general agency framework under `agents/` and `src/runtime/`; leave that untouched unless asked).

## Start of every session
1. Read `docs/STATE.md` (current status, budgets, blockers, next step). Resume from its "Next steps"; do not redo completed work.
2. `git status` and `git branch --show-current`; never overwrite unrelated changes.
3. Read only what the task needs. Map of the project:
   - `channels/invisible-explained/CLAUDE.md`: per-episode production runbook (the daily producer follows it)
   - `channels/invisible-explained/channel.json`: voices, models, prices, budgets, publish slots
   - `channels/invisible-explained/style-bible.md`, `fact-check.md`, `topics.md`, `templates/`
   - `channels/invisible-explained/queue/*.json`: one manifest per episode (state machine, assets, costs, QC)
   - `render/higgsedit/`: resumable edit/render project (`run.sh`, `prepare.py`, components, `episodes/<slug>.jsx`)
   - `src/channel/` (budget guard, queue CLI), `src/youtube/` (publisher, analytics, OAuth helper), `.github/workflows/`
   - `docs/invisible-explained-plan.md`: architecture, capability matrix, YouTube setup steps
   - `docs/SECURITY.md` (exposure + controls), `docs/DAILY-RUN.md` (scheduler definition)
4. Update `docs/STATE.md` after every meaningful milestone (done, pending, blockers, costs, next step).

## Autonomy
The owner has given standing authorization for routine, non-destructive development: inspect, edit, refactor, add features and docs, install trusted free dependencies, run tests/builds, fix bugs, create local branches and commits. Make reasonable engineering decisions without asking; execute, test, fix, continue. Ask only for a genuine blocker, as one concise question with a recommended option.

## Always ask first
- **Money:** buying credits or subscriptions, paid cloud infrastructure, any paid generation (Higgsfield or other) beyond an explicitly approved budget, raising a spending limit. With the request give: operation, estimated cost, benefit, cheaper alternative.
- **Irreversible / sensitive:** deleting important data, destructive git (force-push, branch deletion, history rewrite, merge into `main`), overwriting production systems, account-security changes, exposing credentials, public publishing (until unattended publishing is explicitly authorized), changing financial limits.
- Never bypass platform confirmations or security controls.

## Credits (Higgsfield)
- Approved budgets are windows in `channel.json → budget.windows` (summarised in `docs/STATE.md` → "Budgets"). A `cap: 0` window means no paid generation is approved. Never add or widen a window without the owner's explicit approval. Enforced by `npm run channel -- budget-check <credits> <episode>` before every paid call and `budget-record` after it (ledger: `channels/invisible-explained/ledger/credits.jsonl`).
- Before generating: define the output, pick the cheapest model that meets it, preflight with `get_cost`, reuse existing assets, batch, no extra variants, targeted fixes instead of regeneration. An "unlimited" plan is not free.
- If the budget is insufficient: pause only the paid step, record the blocker, continue other work.
- Cost log per video: `npm run channel -- costs`.

## Tokens
Concise docs; targeted reads and searches; batch independent calls; reuse scripts and templates; prefer deterministic scripts (ffmpeg, Higgsedit, npm scripts) over model work; cheaper models for simple tasks. Never claim a token/spend limit is enforced unless a real platform limit exists.

## Content rules
Accuracy over views: every claim sourced per `fact-check.md`; no misleading titles; AI visuals disclosed. Quality over hitting 3/day.

## Git and security
- Work on `invisible-explained-pipeline` (approved dev branch). Run `npm run hooks` once per clone: the pre-push guard blocks credentials, `.env` files and Higgsfield asset links. Asset links may be pushed only after the owner makes the repo private (`git config tie.repoPrivate true`); until then they stay on the local branch `local/pilot-assets`. Before every push: inspect the staged diff, scan for secrets (keys, OAuth/refresh tokens, `.env`, personal data), confirm `.gitignore` covers `.env*`. The repo is **public**. A previous clean scan does not make a new push safe.
- No force-push, branch deletion or merge into `main` without authorization.
- Credentials only in GitHub Actions secrets or local `.env` (git-ignored); never in files, logs or chat.

## Reporting
At a milestone: completed work, tests run, system status, blockers, credits used, next steps. Never present unfinished work as done. Do not claim anything runs after the session ends unless a real scheduler is configured (see STATE).

## Commands
`npm run typecheck` · `npm test` · `npm run hooks` · `npm run channel -- plan|status|lint|costs|report|approve <id>|reject <id>|assign-slots` · `npm run yt:publish -- --dry-run` · `bash render/higgsedit/run.sh <episode-id> <slug> frames <t,..>` and `python3 render/higgsedit/finalize.py <manifest> <workdir>` (inside the Higgsfield sandbox)
