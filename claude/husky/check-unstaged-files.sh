#!/bin/bash
# Ensure all changes are staged

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  if git diff --name-only | grep -q .; then
    echo "⛔ ERROR: You have unstaged changes."
    echo "❌ All changes must be staged before committing."
    echo "✅ Please use 'git add .' to stage all changes."
    exit 1
  fi
else
  echo "📝 Skipping unstaged changes check for initial commit."
fi
