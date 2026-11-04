#!/usr/bin/env bash
# Rebuild an episode's edit in a (possibly fresh) Higgsfield sandbox.
#   bash run.sh <episode-id> <slug> [prepare|build|frames <t,t,..>]
# Source of truth is the git repo; the sandbox holds only caches.
#   TIE_SYNC=bundle  use sources already unpacked by bundle.sh (works with a private repo)
#   TIE_SYNC=git     (default) anonymous clone/fetch of the branch (public repo only)
set -euo pipefail
EP="$1"; SLUG="$2"; STEP="${3:-build}"
BRANCH="${BRANCH:-invisible-explained-pipeline}"
REPO=/home/user/tie/repo
WORK=/home/user/tie/$EP
if [ "${TIE_SYNC:-git}" = "bundle" ]; then
  [ -f "$REPO/.bundle" ] || { echo "no bundle in $REPO: paste the output of bundle.sh first" >&2; exit 1; }
elif [ -d "$REPO/.git" ]; then git -C "$REPO" fetch -q origin "$BRANCH" && git -C "$REPO" reset -q --hard "origin/$BRANCH";
else git clone -q --depth 1 -b "$BRANCH" https://github.com/imanuli-hub/marketingAgency.git "$REPO" \
  || { echo "clone failed (repo private?): use TIE_SYNC=bundle with bundle.sh" >&2; exit 1; }; fi
mkdir -p "$WORK/edit"
SRC=$REPO/render/higgsedit
cp "$SRC"/*.jsx "$WORK/edit/"
cp "$SRC/episodes/$SLUG.jsx" "$WORK/edit/episode.jsx"
python3 "$SRC/prepare.py" "$REPO/channels/invisible-explained/queue/$EP.json" "$WORK"
cd "$WORK/edit"
# The first build creates project.json but fails until the fonts are vendored.
if [ ! -f .fonts-ok ]; then
  higgsedit build edit.jsx >/dev/null 2>&1 || true
  higgsedit fonts add . "Montserrat:800" "JetBrains Mono:400" >/dev/null && touch .fonts-ok
fi
higgsedit build edit.jsx
if [ "$STEP" = "frames" ]; then
  mkdir -p ../prev
  for t in ${4//,/ }; do
    higgsedit frame . "$t" --out "../prev/f$t.png" >/dev/null
    ffmpeg -v error -y -i "../prev/f$t.png" -vf scale=540:960 -q:v 4 "../prev/f$t.jpg"
  done
  ls ../prev
fi
