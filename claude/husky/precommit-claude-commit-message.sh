#!/bin/bash

# attempt to detect claude in commit message

# Try to grab the commit message from the staging context
LAST_COMMIT_MSG=$(git config --get commit.template && cat "$(git config --get commit.template)" || true)

# If -m was used (staged for commit), fallback to checking index HEAD
if [ -z "$LAST_COMMIT_MSG" ]; then
  STUB_MSG=$(git log -1 --pretty=%B 2>/dev/null)
else
  STUB_MSG="$LAST_COMMIT_MSG"
fi

if echo "$STUB_MSG" | grep -i "claude" >/dev/null; then
  echo "🚫 Pre-commit warning: Potential Claude mention detected in early commit message."
  echo "🛑 Re-issue the commit without mention claude."
  exit 1
fi
