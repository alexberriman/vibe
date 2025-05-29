#!/bin/bash

COMMIT_MSG_FILE=$1

# Filter out Claude-related lines using a temp file
TEMP_FILE=$(mktemp)

grep -v '🤖 Generated with \[Claude Code\]' "$COMMIT_MSG_FILE" |
  grep -v 'Co-Authored-By: Claude <noreply@anthropic.com>' >"$TEMP_FILE"

mv "$TEMP_FILE" "$COMMIT_MSG_FILE"
