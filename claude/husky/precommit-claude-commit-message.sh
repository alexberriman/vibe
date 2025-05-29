#!/bin/bash

# attempt to detect claude in commit message

# Only try to access commit message if GIT_INDEX_FILE exists
# (avoids false reads from previous commits)
GIT_DIR=$(git rev-parse --git-dir)
COMMIT_EDITMSG="$GIT_DIR/COMMIT_EDITMSG"

if [ -f "$COMMIT_EDITMSG" ]; then
  if grep -i "claude" "$COMMIT_EDITMSG" >/dev/null; then
    echo "🚫 Pre-commit warning: Potential Claude mention detected in early commit message."
    echo "🛑 Re-issue the commit without mentioning Claude."
    exit 1
  fi
else
  echo "ℹ️ Skipping early commit message check — no COMMIT_EDITMSG available yet."
fi
