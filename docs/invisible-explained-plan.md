# The Invisible Explained: automation plan

Status 2026-11-04. Discovery done; foundation built and tested offline. **No credits spent, nothing uploaded.**

## 1. What discovery found

| Area | Finding |
|---|---|
| This repo | A general agency framework plus an episode pipeline built for a toddler channel (OpenArt + ElevenLabs direct, FFmpeg assembly). Nothing about this channel existed here. FFmpeg helpers in `src/production/video.ts` are reusable. |
| Finished videos | 9 final renders in Higgsfield (Oct 26 and 28, 5 distinct topics: deep ocean, black hole, phone transistors, Moon gone, lightning). All 1080x1920, 30 fps, 29.6–31.0 s, made with Higgsfield `/content-factory` (every frame drawn in code). |
| Other work | Voiceovers for sleep loss, coffee, running (Oct 25); photoreal Kling test for fear/adrenaline (Oct 26); cartoon-mascot tests for 5 everyday topics (Oct 29). Unrelated client work (sushi ad, face swaps) ignored. |
| Visual identity | Recovered into `channels/invisible-explained/style-bible.md` (navy + cyan, Montserrat caps karaoke captions, mono scene labels with honesty tags, data callouts, end card). |
| Voice | Inconsistent: Alistair ×5, Gideon ×4, Desmond ×2, Caspian ×1 takes (ElevenLabs v4 via Higgsfield, stability 0.40–0.45). Needs one decision. |
| Cost history | Code-drawn finals cost only the voiceover, about 2.8 credits each. Photoreal tests: Kling 3.0 pro 10 cr per 5 s clip with sound, GPT Image 2.75–4.25 per still. |
| Higgsfield account | Ultra plan, 612.1 credits, no projects. |
| YouTube analytics | **Not available.** No YouTube connector; this container's network blocks googleapis. Which videos were actually uploaded, and their performance, is UNKNOWN. |

## 2. Capabilities

| Capability | State |
|---|---|
| Higgsfield generation (images, Kling video, ElevenLabs v4 voice), cost preflight, balance | **Available now** (connector) |
| Media processing and rendering: Higgsfield sandbox with ffmpeg, Higgsedit, faster-whisper, Montserrat | **Available now** |
| Research and fact-check (web search) | **Available now** |
| Episode state, budgets, credit ledger, reports, resume (`npm run channel`) | **Built and tested** |
| YouTube upload + scheduling + duplicate guard + verification (`npm run yt:publish`, GitHub Action) | **Built; dry-run tested.** Needs configuration (below) |
| YouTube analytics pull (`npm run yt:analytics`, GitHub Action) | **Built; untested** until credentials exist |
| Daily unattended producer | **Needs configuration**: a Claude Code scheduled task (cloud, fresh session daily, Higgsfield connector attached) running `channels/invisible-explained/CLAUDE.md` |
| Google Cloud project + OAuth client + YouTube API compliance audit | **External service.** Without the audit, API uploads are locked to private (manual publish in Studio still works). |
| Shorts "viewed vs swiped away", "when viewers are online" | **Not supported** by the public API (Studio only). Publish times will be tuned from per-video results instead. |
| Downloading Higgsfield media inside this cloud container | **Blocked** by the environment network policy; work around: all media work runs in the Higgsfield sandbox. |

## 3. Architecture

```
Claude scheduled task (daily, cloud)                GitHub Actions (cloud)
  reads channels/invisible-explained/CLAUDE.md        youtube-publish (every 2 h)
  topic → fact-check → script → storyboard              approved + qc_passed only
  Higgsfield: voice, stills, clips (budget-gated)       private + publishAt, duplicate guard,
  Higgsfield sandbox: edit, captions, SFX, render       verify public afterwards
  QC → metadata → manifest status qc_passed           youtube-analytics (daily)
  push state to branch channel-state  ─────────────►    writes analytics/latest-summary.md
                ▲                                                  │
                └──────────── next day's topic choice ◄────────────┘
Owner: watches the render URL in the daily report, then approves or rejects.
```

No local computer is involved. All state is in git (`channel-state` branch), so any run can resume, and every paid asset id is recorded before the next step.

## 4. Visual mode and cost (quoted 2026-11-04 with get_cost)

| Mode | What | Credits / video | 3 per day, 30 days |
|---|---|---|---|
| Signature | Today's finals look; every frame in code | ~2.8 | ~250 |
| **Hybrid** (proposed) | 7 photoreal stills (Nano Banana 2, 1.5 each) + 3 animated with Kling 3.0 std silent (6.25 each), overlays/captions in code | ~32 | ~2,900 |
| Photoreal | Still + Kling clip for all 7 scenes | ~57 | ~5,100 |

Rejected on price: Seedance 2.5 (35 per 5 s clip), Grok Video 1.5 (22.5). The 612-credit balance covers about 19 hybrid videos (~6 days at 3/day). Monthly plan allowance is UNKNOWN.

## 5. Rollout

1. **One test video** (`queue/2026-11-05-a-self-tickle.json`, scripted and fact-checked) produced end to end after owner sign-off on mode, voice and spend. Measure real credits, render quality, time.
2. Owner reviews; fix the runbook from what the test teaches.
3. Configure YouTube (section 6), dry-run, then upload the approved test as private-scheduled.
4. Three videos a day, still owner-approved each.
5. Turn on `autoPublish` only after the owner explicitly approves the workflow (set `phase: production`, `autoPublish: true`).

## 6. Owner setup for YouTube (about 20 minutes)

1. Google Cloud Console: new project → enable **YouTube Data API v3** and **YouTube Analytics API** → OAuth consent screen (External, add yourself as test user) → Credentials → OAuth client ID, type **Desktop app**.
2. On your computer, in this repo: `YT_CLIENT_ID=… YT_CLIENT_SECRET=… npm run yt:auth`, sign in with the channel's Google account, copy the printed refresh token.
3. GitHub → repo Settings → Secrets → Actions: add `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`. Never paste them into chat or files.
4. Apply for the YouTube API audit (needed for public/scheduled API uploads). Until it passes, uploads stay private and you press Publish in Studio.
5. Make this repository **private** before enabling the analytics schedule (it is public now).
