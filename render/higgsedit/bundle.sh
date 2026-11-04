#!/usr/bin/env bash
# Prints ONE shell command that recreates this repo's render sources and an
# episode manifest inside the Higgsfield sandbox, without cloning the repo
# (works when the GitHub repo is private). Paste its output into sandbox_exec,
# then run run.sh there with TIE_SYNC=bundle.
#   bash render/higgsedit/bundle.sh <episode-id> > /tmp/sync.sh
set -euo pipefail
EP="$1"
cd "$(git rev-parse --show-toplevel)"
B64=$(tar -czf - render/higgsedit "channels/invisible-explained/queue/$EP.json" | base64 -w0)
echo "mkdir -p /home/user/tie/repo && cd /home/user/tie/repo && rm -rf render && echo '$B64' | base64 -d | tar -xzf - && touch .bundle && echo synced \$(find render channels -type f | wc -l) files"
