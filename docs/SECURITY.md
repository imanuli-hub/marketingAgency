# Security notes

## Exposed Higgsfield asset links (found 2026-11-05)
While this repo was public, the test episode's manifest and two docs were pushed with Higgsfield CDN links. Each link contains the account's storage path id (`user_…`) and opens the file for anyone who has it.

| What | Count | Where (pushed) |
|---|---|---|
| Final test video (self-tickle) | 1 | queue manifest, `reports/2026-11-04.md`, `docs/STATE.md` |
| Voice take (two narrators) | 1 | queue manifest |
| Photoreal stills | 4 | queue manifest |
| Kling clips | 4 | queue manifest |
| Presigned upload URLs, API keys, tokens | 0 | none found |

History: commits `3db072c`, `5b4a9fb`, `4e06923`, `3776fdf`, `382dbc2` on `invisible-explained-pipeline`. `main` is clean.

**Making the repo private does not revoke these links.** They are bearer URLs on Higgsfield's CDN; anyone who copied, cloned, forked or cached the repo keeps working links. Only deleting the files on Higgsfield's side would break them, and it is unknown whether its CDN purges on deletion. Content exposed: one unreleased educational video and its raw assets; no personal data beyond the storage id.

## Controls in place
- `scripts/git-hooks/pre-push` (install: `npm run hooks`): blocks pushes adding credentials, `.env` files, or Higgsfield asset links. Asset links pass only after `git config tie.repoPrivate true`, which is set once the owner has made the repo private.
- Docs and reports reference Higgsfield media ids, not links. Only episode manifests carry links (the publisher needs `render.url`).
- `render/higgsedit/bundle.sh` + `TIE_SYNC=bundle`: the Higgsfield sandbox gets render sources without cloning, so a private repo does not break rendering.
- YouTube credentials only as GitHub Actions secrets; `.env*` git-ignored.

## Owner actions
1. **Make the repo private** (GitHub → Settings → General → Danger Zone → Change visibility). Then run `git config tie.repoPrivate true` in the working clone (the agent does this when told).
2. Optional, irreversible: rewrite history to remove the 10 links (needs force-push; only useful together with step 3, since copies may already exist).
3. Optional: delete the exposed raw assets in Higgsfield (stills, clips, voice) if their exposure matters; keep the final video until it is published or rejected.
4. After going private: GitHub Actions minutes become metered (Free plan: 2,000 min/month). The planned workflows use far less (tests on push, publisher every 2 h ≈ 1 min/run).
