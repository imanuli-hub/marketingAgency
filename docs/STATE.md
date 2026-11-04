# Project state: The Invisible Explained

Last checkpoint: 2026-11-04 (late) · tests: `npm test` 12/12 pass · branch `invisible-explained-pipeline` (pushed; not merged; no PR)

## Status
Pipeline foundation built; first end-to-end test Short produced and QC-passed; **awaiting owner review**. Nothing uploaded to YouTube. No unattended scheduler exists yet: nothing runs between sessions.

## Milestones done
- Discovery: recovered channel identity from 9 earlier finals (Higgsfield `/content-factory`), voices, costs → `style-bible.md`, `topics.md`.
- Channel config, fact-check standard, script/storyboard templates, production runbook.
- Episode manifests (resumable state machine), credit ledger + caps, queue CLI, daily report.
- YouTube publisher (private + scheduled publishAt, duplicate guard, publish verification), analytics pull, OAuth helper, 2 GitHub workflows; dry-run tested only.
- Resumable Higgsedit render project (`render/higgsedit/`), code-drawn mascot.
- Test episode `2026-11-05-a-self-tickle`: 40 s, 4 photoreal + 6 cartoon scenes, two narrators, QC pass. Final: https://d2ol7oe51mr4n9.cloudfront.net/user_39JGmw6wEGtbCV9BkSpeMCHa84G/351fd9dc-9c58-4cce-b587-5174466a8252.mp4

## Owner decisions
- Visual mix per video: 4 photoreal (nano_banana_2 still + kling3_0 std 5 s) + 6 code-drawn cartoon scenes (ice-cream mascot style).
- Narrators: Alistair on photoreal scenes, Dylan on cartoon scenes, one ElevenLabs v4 dialogue take.
- Approval required before any public publishing; `autoPublish` off.

## Budgets
| Item | Approved | Used |
|---|---|---|
| First test video | 45 cr | 33.99 cr (balance 612.10 → 578.11) |
| Ongoing production | **none approved yet** | - |

Measured cost per video: 33.99 cr (VO 2.99, 4 stills 6.00, 4 clips 25.00). 3/day ≈ 102 cr/day ≈ 3,060 cr/month. Paid generation is paused until the owner approves a budget.

## Integrations
| Integration | State |
|---|---|
| Higgsfield (connector + sandbox) | working |
| GitHub (repo push to dev branch) | working |
| YouTube Data/Analytics API | code ready; needs owner OAuth setup + GitHub secrets |
| Scheduler for daily runs | not configured (needs budget + owner go-ahead) |

## Blockers (owner)
1. Review/approve the test video.
2. Approve an ongoing credit budget (daily/monthly).
3. YouTube setup (docs/invisible-explained-plan.md §6); Google API audit for public API uploads.
4. Make repo private before enabling analytics; workflows run only from the default branch, so they need a merge into `main` (owner authorization).

## Known issues
- This cloud container cannot reach Higgsfield's CDN or googleapis (network policy); all media work runs in the Higgsfield sandbox, YouTube calls run in GitHub Actions.
- Higgsfield sandbox can be reset at any time; all render inputs are in git, so `run.sh` rebuilds.
- Kling may stylize anatomy (cerebellum clip); keep `· ILLUSTRATIVE` labels.
- **Exposure (public repo):** episode manifests and reports contain Higgsfield CDN URLs, which include the account's storage path id and let anyone with the link view unreleased assets. Already in pushed history. Fix: make the repo private (owner). Scrubbing history needs a force-push (owner authorization).
- An orphaned unconfirmed upload (first master, media cdae3183…) exists in Higgsfield storage; harmless.

## Next steps
1. ~~(agent) Tests + cost-log command + report date fix~~ done: `npm test` (10 tests), `npm run channel -- costs`, CI workflow `test.yml`.
2. ~~(agent) Script and fact-check the next 3 episodes~~ done: `2026-11-06-a-goosebumps`, `-b-noise-cancelling`, `-c-static-shock` (status fact_checked, lint ok, ~45 s each, est. 33.99 cr each = 101.97 cr total). Added `channel lint` pre-spend gate; word rate corrected to the measured 2.2 words/s (maxWords 97).
3. (agent, when a budget exists) Produce those 3: voice + stills + clips (one batch each), write `render/higgsedit/episodes/<slug>.jsx` for the cartoon scenes, preview, render, QC.
4. (owner) Items in Blockers. Then: produce the 3 episodes, configure the daily scheduled run, YouTube dry-run → first private scheduled upload.
