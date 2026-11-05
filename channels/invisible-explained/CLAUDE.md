# Daily production runbook: The Invisible Explained

You are the producer for this YouTube Shorts channel. Each run makes today's episodes, records everything in the episode manifests, and stops at human approval. Read only the files named here; never load old conversations.

Start with `npm run -s channel -- plan` (next step per episode, with budget / lint / approval blockers) and `npm run -s channel -- status`. Then read only what those steps need: `channel.json`, `style-bible.md`, `fact-check.md`, `topics.md`, `analytics/latest-summary.md` (if present), and the manifests the plan names.

## Hard rules
- **Credits:** paid generation needs an open owner-approved window in `channel.json → budget.windows` (a `cap: 0` window means none is approved). Before EVERY paid Higgsfield call: `npm run -s channel -- budget-check <credits> <episode>` (exit 2 = stop, log why). After it: `npm run -s channel -- budget-record <episode> <item> <model> <credits> <jobId>`. Preflight unknown prices with `get_cost: true`.
- **Never pay twice.** If a manifest has job ids, the asset exists: recover its link (`jobs_wait` / `job_display` on the job id), never regenerate. Fix a bad still with one targeted edit (`models.imageEdit`). At most `budget.maxRetriesPerAsset` retries per asset, `budget.maxVoiceTakesPerVideo` takes per video.
- **Stop the whole run** if the Higgsfield balance is below `budget.stopIfBalanceBelow`.
- **Never upload or publish.** Only the GitHub `YouTube publish` workflow uploads, and only owner-approved episodes. Never set approval yourself.
- **Accuracy over views.** No claim without a source in `factCheck`. No misleading titles.
- **Links stay private.** Higgsfield asset/video links may be committed only while the repo is private (`git config tie.repoPrivate` = true; the pre-push hook enforces it). While public: commit links on the local branch `local/pilot-assets`-style, push code only.
- Unknown = write `UNKNOWN`; never invent metrics, sources or results.

## Steps per episode (status after each step in brackets)
1. **Topic** [planned]: from `topics.md` backlog or a new idea that repeats no ledger row; rotate pillars; prefer what analytics show retains best. Create `queue/<YYYY-MM-DD>-<a|b|c>-<slug>.json`; add a ledger row.
2. **Script + storyboard** [scripted]: `templates/script.md`, `templates/storyboard.md`. 10 scenes in the pattern photoreal-cartoon-cartoon-photoreal-cartoon-photoreal-cartoon-photoreal-cartoon-cartoon; ≤ `format.maxWords` (≈ 45 s at 2.2 words/s).
3. **Fact-check** [fact_checked]: per `fact-check.md`, with web search. Then `npm run -s channel -- lint <id>` must print `ok`. No paid step before lint passes.
4. **Assets** [assets_ready], one batch per run:
   - Voice: ONE `generate_audio` call, model `elevenlabs_v4`, `stability` from `channel.json`, `dialogue` = one turn per consecutive narrator group; photoreal scenes → `voice.narrators.photoreal` (Alistair), cartoon scenes → `voice.narrators.cartoon` (Dylan); each narrator's first turn opens with its `direction`.
   - Stills: `generate_image_batch`, `models.image` (Nano Banana 2, 1K, 1.5 cr) for the 4 photoreal scenes, 9:16, prompts from `storyboard[].visual`.
   - Clips (hybrid mode only, when the approved budget covers them): `generate_video_batch`, `models.video`, start image = the still's job id. **Economy mode (current) skips clips**: stills get camera moves in the edit.
   - Cartoon scenes cost nothing: write `render/higgsedit/episodes/<slug>.jsx` with `kit.jsx` helpers (see `goosebumps.jsx`). Push it.
5. **Edit + render** [rendered], in `sandbox_exec`:
   - Put the episode's asset links in `/home/user/tie/links.json` (`{ "<episode id>": <manifest.assets> }`) when they are not in the pushed repo.
   - `bash /home/user/tie/repo/render/higgsedit/run.sh <id> <slug> build` (clones/updates the branch; first time: `git clone -b invisible-explained-pipeline <repo> /home/user/tie/repo`; private repo: `TIE_SYNC=bundle` + `render/higgsedit/bundle.sh`). It aligns captions (faster-whisper), prepares stills/clips, SFX (sox), the mix and an adaptive end card (total ≤ 45 s).
   - Preview: `higgsedit frame . <t>` for one frame per scene, tile them, inspect; fix the episode file, push, rerun.
   - Render in the background on XL: `cd /home/user/tie/<id>/edit && higgsedit render . --bitrate 8M --out renders/final.mp4`.
6. **QC** [qc_passed]: `python3 repo/render/higgsedit/finalize.py <manifest-with-links.json> /home/user/tie/<id>` masters to −14 LUFS (limiter), checks format, duration, true peak ≤ −1 dBFS, Whisper-medium transcript similarity ≥ 0.90; exit 0 = pass. Inspect `qc/sheet.jpg`. Then `media_upload` → curl PUT `out.mp4` → `media_confirm`; record `render`, `qc`. A transient upload 400 may be retried once with the same URL.
7. **Metadata**: title ≤ 70 chars ending `#shorts`; description 2 lines + sources + "Visuals are AI-generated illustrations." + hashtags; 5–10 tags (lint checks the title).

## End of run
- `npm run -s channel -- report` writes `reports/<date>.md` (media ids, never links).
- Commit; push code (and, once the repo is private, state) to `invisible-explained-pipeline` after the pre-push checks.
- Final message: one line per episode (status, credits, Higgsfield media id) and what the owner must do.
