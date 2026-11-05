# Project state: The Invisible Explained

Last checkpoint: 2026-11-05 · tests `npm test` 14/14 · branch `invisible-explained-pipeline` (pushed; not merged; no PR) + local-only branch `local/pilot-assets` (asset links, see Security)

## Status
4 Shorts produced, QC-passed, uploaded to Higgsfield storage, **awaiting owner review**. Nothing on YouTube. No scheduler runs between sessions. Paid generation is **blocked** (no approved budget).

| Episode | Mode | Length | Credits | Higgsfield media | Status |
|---|---|---|---|---|---|
| 2026-11-05-a-self-tickle | hybrid (4 Kling clips) | 40.0 s | 33.99 | 351fd9dc-9c58-4cce-b587-5174466a8252 | qc_passed |
| 2026-11-06-a-goosebumps | economy (stills) | 43.1 s | 8.99 | 78e12fea-e322-48b2-9785-87ef97317482 | qc_passed |
| 2026-11-06-b-noise-cancelling | economy | 44.9 s | 9.22 | bbd9d223-8f83-4f90-b1c9-a7ab740367a7 | qc_passed |
| 2026-11-06-c-static-shock | economy | 40.6 s | 8.99 | 0d44f558-4bfa-4793-be90-215eb8418d25 | qc_passed |

The 3 pilot manifests on the pushed branch still read `fact_checked` (their links/QC live on `local/pilot-assets`); `channel plan` handles this safely ("do NOT regenerate").

## Budgets
| Window | Cap | Used | State |
|---|---|---|---|
| First test video | 45 | 33.99 | closed |
| `pilot-3-economy` (owner, 2026-11-04) | 30 total | **27.20** | closed after the 3 videos |
| `no-approved-budget` | 0 | 0 | **active: blocks all paid calls** |

Higgsfield balance 550.91 (ledger and balance agree). Measured: economy 9.07 cr/video avg; hybrid 33.99.

## Owner decisions
- Economy production for the pilot: 4 photoreal 1K stills with camera moves + 6 code-drawn cartoon scenes (ice-cream mascot). Hybrid (Kling clips) remains available.
- Narrators: Alistair (photoreal scenes) + Dylan (cartoon scenes) in one ElevenLabs v4 take.
- No public publishing; `autoPublish` off.

## Milestones done
- Discovery, channel bible, runbook, manifests/ledger/caps, YouTube publisher + analytics (dry-run tested), resumable Higgsedit render.
- Root `CLAUDE.md` policy; this state file; CI (`test.yml`); cost log (`channel costs`).
- Security: exposure inventory (`docs/SECURITY.md`), pre-push guard, bundle sync for a private repo, links out of docs/reports.
- Budget windows; `channel lint` pre-spend gate; `channel plan` next-step planner; `finalize.py` master + QC; adaptive end card (≤ 45 s); `kit.jsx` cartoon helpers; 3 pilot episodes.

## Integrations
| Integration | State |
|---|---|
| Higgsfield (generation, sandbox, storage) | working |
| GitHub push (dev branch), Actions CI | working (CI green) |
| YouTube Data/Analytics API | code ready; needs owner OAuth + secrets; API audit for public uploads |
| Daily scheduler | defined in `docs/DAILY-RUN.md`, not created |

## Blockers (owner)
1. Review the 4 videos; approve or reject each.
2. Make the repo private (then the agent sets `tie.repoPrivate` and pushes `local/pilot-assets`). See `docs/SECURITY.md` for remaining exposure actions.
3. Approve a recurring budget before any further generation or the daily scheduler.
4. YouTube setup (plan §6); merging workflows into `main` needs owner OK.

## Known issues
- Pushed history still contains 10 test-episode asset links (needs owner decision on history rewrite / Higgsfield deletion).
- Container network blocks Higgsfield CDN and googleapis; media work runs in the Higgsfield sandbox, YouTube in GitHub Actions.
- Higgsfield sandbox and Claude worker restart often; all state is in git + job ids, everything resumes.
- Whisper `small` mishears some words ("millionths"); QC uses `medium`.

## Next steps
1. (owner) Blockers 1–3.
2. (agent, after repo private) rebase + push `local/pilot-assets`; set `tie.repoPrivate true`.
3. (agent, after budget) schedule the daily run per `docs/DAILY-RUN.md`; YouTube dry-run → first private scheduled upload of approved videos.
