#!/bin/bash
# Block direct modification of Husky hooks

HUSKY_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.husky/' || true)

if [ -n "$HUSKY_FILES" ]; then
  echo "⛔ ERROR: You are trying to modify Husky hooks."
  echo ""
  echo "Affected files:"
  echo "$HUSKY_FILES"
  exit 1
fi
