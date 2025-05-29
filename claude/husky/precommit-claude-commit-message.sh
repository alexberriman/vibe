#!/bin/bash
# Block Claude mentions or AI tags in commit messages

COMMIT_MSG_FILE="$(git rev-parse --git-path COMMIT_EDITMSG)"

if [ -f "$COMMIT_MSG_FILE" ]; then
  COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
  if echo "$COMMIT_MSG" | grep -Ei "claude|Co-Authored-By:.*claude|Generated with \[Claude Code\]" >/dev/null; then
    echo "🚫 Commit rejected: Please avoid mentioning Claude in commit messages."
    echo "❌ Remove AI co-author tags or generated comments from commit messages."
    echo "✅ Use messages that describe WHAT changed and WHY."
    exit 1
  fi
fi
