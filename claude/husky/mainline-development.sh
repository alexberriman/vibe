#!/bin/bash
# Ensure commit is on main branch or it's the initial commit

if git rev-parse --abbrev-ref HEAD 2>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$BRANCH" != "main" ]; then
    echo "⛔ ERROR: This repository uses mainline development."
    echo "❌ Branches are not permitted in this repository."
    echo "✅ Please commit and push directly to main."
    exit 1
  fi
else
  echo "📝 This appears to be the initial commit - proceeding with checks."
fi
