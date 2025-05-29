#!/bin/bash

COMMIT_MSG_FILE=$1

# Strip Claude-related lines (macOS-compatible sed)
sed -i '' '/🤖 Generated with \[Claude Code\]/d' "$COMMIT_MSG_FILE"
sed -i '' '/Co-Authored-By: Claude <noreply@anthropic.com>/d' "$COMMIT_MSG_FILE"
