#!/usr/bin/env bash
# Rebuild an episode's edit in a (possibly fresh) Higgsfield sandbox.
#   bash run.sh <episode-id> <slug> [prepare|build|frames <t,t,..>]
# Source of truth is the public repo branch; the sandbox holds only caches.
set -euo pipefail
EP="$1"; SLUG="$2"; STEP="${3:-build}"
BRANCH="${BRANCH:-invisible-explained-pipeline}"
REPO=/home/user/tie/repo
WORK=/home/user/tie/$EP
if [ -d "$REPO/.git" ]; then git -C "$REPO" fetch -q origin "$BRANCH" && git -C "$REPO" reset -q --hard "origin/$BRANCH";
else git clone -q --depth 1 -b "$BRANCH" https://github.com/imanuli-hub/marketingAgency.git "$REPO"; fi
mkdir -p "$WORK/edit"
SRC=$REPO/render/higgsedit
cp "$SRC/brand.jsx" "$SRC/mascot.jsx" "$SRC/edit.jsx" "$WORK/edit/"
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
