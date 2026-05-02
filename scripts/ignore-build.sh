#!/bin/bash

# Decide whether to run a build.
# Exit 1 => run build
# Exit 0 => skip build

env="${VERCEL_ENV:-}"
ref="${VERCEL_GIT_COMMIT_REF:-}"
pr_id="${VERCEL_GIT_PULL_REQUEST_ID:-}"
msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"

# --- Production rule ---
# Build only when it's a release-please merge commit
if [[ "$env" == "production" ]] && \
   [[ "$msg" == *"release-please--branches--main"* ]] && \
   [[ "$msg" == *"chore(main): release"* ]]; then
  exit 1
fi

# --- Preview rule ---
# Build for:
# - dev branch pushes
if [[ "$env" == "preview" ]] && [[ "$ref" == "dev" ]]; then
  exit 1
fi

# Everything else: skip build
exit 0
