#!/usr/bin/env bash
# One-time setup for the GOOD® studio (render harness). Safe to re-run.
#   bash tools/studio/setup.sh [profile-slug ...]   # also fetches those members' skins as models
set -e
cd "$(dirname "$0")"
mkdir -p vendor models work
[ -s vendor/skinview3d.bundle.js ] || curl -sL -o vendor/skinview3d.bundle.js https://cdn.jsdelivr.net/npm/skinview3d@3.1.0/bundles/skinview3d.bundle.js
for slug in "$@"; do
  curl -sfL -o "models/$slug.png" "https://good.leems.me/api/profile?name=$slug&skin=1" && echo "model $slug" || echo "no skin for $slug"
done
ls models
