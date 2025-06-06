#!/usr/bin/env bash

# Get the branch name we're trying to checkout
BRANCH="$1"

# First check if the repository has any commits yet
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  # Repository has at least one commit
  if [ "$BRANCH" != "main" ]; then
    echo "⛔ ERROR: This repository uses mainline development."
    echo "❌ Branches are not permitted in this repository."
    echo "✅ Please commit and push directly to main."
    exit 1
  fi
else
  # Initial repository state - only allow checkout to main
  if [ "$BRANCH" != "main" ]; then
    echo "⛔ ERROR: This repository uses mainline development."
    echo "❌ Branches are not permitted in this repository."
    echo "✅ Please use the main branch for initial development."
    exit 1
  fi
fi
