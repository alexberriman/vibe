#!/bin/bash
# .husky/commit-msg

COMMIT_MSG_FILE="$1"

if [ ! -f "$COMMIT_MSG_FILE" ]; then
  echo "❌ Commit message file not found: $COMMIT_MSG_FILE"
  exit 1
fi

if grep -Ei "claude|Co-Authored-By:.*claude|Generated with \[Claude Code\]" "$COMMIT_MSG_FILE" >/dev/null; then
  echo "🚫 Commit rejected: Please avoid mentioning Claude in commit messages."
  echo "❌ Remove AI co-author tags or generated comments from commit messages."
  echo "✅ Use messages that describe WHAT changed and WHY."
  exit 1
fi
