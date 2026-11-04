# Daily production runbook: The Invisible Explained

You are the producer for this YouTube Shorts channel. Each run makes today's episodes, records everything in the episode manifests, and stops at human approval. Read only the files named here; never load old conversations.

Read first (in this order, nothing else): `channel.json`, `style-bible.md`, `fact-check.md`, `topics.md`, `analytics/latest-summary.md` (if present), and the manifests in `queue/` that are not `published`/`rejected`.

## Hard rules
- **Credits:** before EVERY paid Higgsfield call run `npm run -s channel -- budget-check <credits> <episode>`. Exit code 2 = stop that episode, log why. After every paid call run `npm run -s channel -- budget-record <episode> <item> <model> <credits> <jobId>`. Quote with `get_cost: true` when the price is not in `channel.json`.
- **Never regenerate** an asset whose job id is already in the manifest. Fix a bad still with one targeted edit (`models.imageEdit`), not a new generation. At most `budget.maxRetriesPerAsset` retries per asset, `budget.maxVoiceTakesPerVideo` takes per video.
- **Stop the whole run** if the Higgsfield balance (`balance` tool) is below `budget.stopIfBalanceBelow`.
- **Never upload or publish.** Uploading is done only by the GitHub `YouTube publish` workflow, and only for episodes the owner approved (`approval.state = approved`). Never set approval yourself.
- **Accuracy over views.** No claim without a source in `factCheck`. No misleading titles.
- Unknown = write `UNKNOWN`; never invent metrics, sources or results.

## Resume
A manifest's `status` says what is done. Pick up each unfinished episode at its next step. Steps whose outputs (job ids, media ids, URLs) are already recorded are skipped.

## Steps per episode (status after each step in brackets)
1. **Topic** [planned]: choose from `topics.md` backlog or a new idea that repeats no ledger row; rotate pillars; prefer pillars/topics that analytics show retain best. Create `queue/<YYYY-MM-DD>-<a|b|c>-<slug>.json` and add a ledger row.
2. **Script + storyboard** [scripted]: follow `templates/script.md` and `templates/storyboard.md`. 25–45 s at ~2.5 words/s.
3. **Fact-check** [fact_checked]: per `fact-check.md`, with web search. Fail → rewrite the claim or cut it.
4. **Assets** [assets_ready]: all in one batch where possible.
   - Voice: ONE `generate_audio` call, model `elevenlabs_v4`, `stability` from `channel.json`, `dialogue` = one turn per scene group in order: photoreal scenes → `voice.narrators.photoreal` (Alistair), cartoon scenes → `voice.narrators.cartoon` (Dylan); each narrator's first turn opens with its `direction`. `prompt` = all turns joined. Record turns in `script.dialogue`.
   - Stills: `generate_image_batch` with `models.image` for the 4 photoreal scenes at once, 9:16.
   - Clips: `generate_video_batch` with `models.video` for the same 4 scenes, start image = that scene's still job id.
   - Cartoon scenes cost nothing: write `render/higgsedit/episodes/<slug>.jsx` (copy the structure of `self-tickle.jsx`; reuse `Mascot`, `Brain`, props drawn with paths). Push it before rendering.
   - `jobs_wait` in groups; record every job id, URL and credit in the manifest.
5. **Edit + render** [rendered]: push the manifest and episode file, then in `sandbox_exec` run `bash <(curl -s https://raw.githubusercontent.com/imanuli-hub/marketingAgency/<branch>/render/higgsedit/run.sh) <episode id> <slug> frames <t1,t2,t3,t4>` (it clones the branch, downloads assets, aligns captions with faster-whisper, retimes clips, synthesizes SFX with sox, builds). Inspect the preview frames; fix the episode file, push, rerun. Then render in the background on an XL sandbox: `cd /home/user/tie/<episode id>/edit && higgsedit render . --bitrate 8M --out renders/final.mp4`. Normalize to -14 LUFS (plain gain), upload with `media_upload` + `media_confirm`; record `render.mediaId`, `render.url`, `render.seconds`. The sandbox can be reset at any time: everything needed to resume is in git.
6. **QC** [qc_passed]: ffprobe (1080x1920, 30 fps, 25–45 s, audio present), loudness, contact sheet of 6 frames inspected with `image_paths` (captions readable, nothing cut off, no garbled AI text, labels present), Whisper transcript matches `voiceText`. Record each check in `qc`. One fix pass allowed; then `failed`.
7. **Metadata**: title (≤ 70 chars, the question the video answers, ends with `#shorts`), description (2 lines + sources + "Visuals are AI-generated illustrations." + 3–5 hashtags), 5–10 tags.

## End of run
- `npm run -s channel -- report` writes `reports/<date>.md`. Keep it short.
- Commit `channels/invisible-explained/` and push to branch `channel-state` (merge `origin/main` into it first so code stays current).
- Final message: one line per episode (status, credits, render URL) and what the owner must do (approve or reject with `npm run channel -- approve <id>`).
