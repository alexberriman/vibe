#!/usr/bin/env bash

# Check if this is the first commit
if git rev-parse HEAD~1 >/dev/null 2>&1; then
  # Not the first commit, proceed with normal checks

  # Get the current branch
  BRANCH=$(git rev-parse --abbrev-ref HEAD)

  if [ "$BRANCH" = "main" ]; then
    # Check if there are any unpushed commits
    UNPUSHED_COMMITS=$(git log @{u}..HEAD 2>/dev/null || echo "noupstream")

    if [ "$UNPUSHED_COMMITS" = "noupstream" ]; then
      echo "🔄 REMINDER: You've committed to main but there's no upstream branch."
      echo "   Consider setting up a remote and pushing your changes."
      echo ""
    elif [ -n "$UNPUSHED_COMMITS" ]; then
      echo "🔄 REMINDER: You've committed to main but haven't pushed to remote yet."
      echo "   Remember to push your changes with 'git push'."
      echo ""
    fi
  fi
else
  # This is the first commit
  echo "🎉 Congratulations on your first commit!"
  echo "   Consider setting up a remote and pushing your changes with 'git push'."
  echo ""
fi
