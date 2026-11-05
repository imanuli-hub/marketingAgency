# Daily unattended run (defined, NOT scheduled)

Status: ready to schedule; **not created**. Nothing runs between sessions today.

## Mechanism
A Claude Code cloud scheduled task (fresh session per run, Higgsfield connector attached) on this repo, once a day. No local computer involved. The GitHub `YouTube publish` workflow uploads separately, only approved episodes.

## Preconditions (all required before scheduling)
1. Owner approves a recurring credit budget → added as a window in `channel.json → budget.windows` (e.g. `{ "name": "daily-3-economy", "from": <date>, "cap": <monthly cap> }`) plus a daily cap. Economy mode measured 9.07 cr/video ≈ 27 cr/day ≈ 820 cr/month for 3/day.
2. Repo private and `git config tie.repoPrivate true`, so the run can push state with asset links.
3. Owner OK to create the scheduled task (it spends credits within the window unattended).
4. Optional but recommended first: YouTube setup (docs/invisible-explained-plan.md §6) so approved videos can be uploaded.

## Scheduled prompt (fresh session)
```
You are the daily producer for The Invisible Explained in the repo imanuli-hub/marketingAgency,
branch invisible-explained-pipeline. Read CLAUDE.md and docs/STATE.md, then follow
channels/invisible-explained/CLAUDE.md exactly. Start with `npm ci`, `npm run hooks`,
`npm run -s channel -- plan`. Produce at most 3 episodes, never exceeding an approved budget
window (budget-check before every paid call; exit 2 = stop). Never upload, publish or approve.
Update docs/STATE.md, commit, push (pre-push checks), and end with a 5-line report:
episodes and statuses, credits spent today, blockers, what the owner must review.
```
Suggested schedule: once daily, outside 06:00–09:00 Pacific; publish slots stay in `channel.json → publishing.slots`.

## Safety already enforced in code
- Budget windows and caps (`budget-check`), cost ledger, `costs` report.
- `lint` gate before paid steps; `plan` never re-buys assets with job ids.
- Pre-push guard (credentials, `.env`, asset links while public).
- Publisher uploads only `qc_passed` + owner-approved, private + scheduled, duplicate-guarded.
