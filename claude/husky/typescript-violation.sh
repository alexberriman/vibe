#!/bin/bash
# Prevent usage of TypeScript suppression comments

TS_BYPASS_FILES=$(git diff --cached -U0 | grep -E '\+.*(@ts-ignore|@ts-nocheck|\/\/ @ts-expect-error)' || true)

if [ -n "$TS_BYPASS_FILES" ]; then
  echo "⛔ ERROR: TypeScript bypass directives detected."
  echo ""
  echo "Detected lines:"
  echo "$TS_BYPASS_FILES"
  exit 1
fi

# Block weakening of TypeScript config

TS_CONFIG_WEAKENING=$(git diff --cached -U0 tsconfig*.json | grep -E '\+.*(noImplicitAny|strict|skipLibCheck|allowJs|checkJs).*false' || true)

if [ -n "$TS_CONFIG_WEAKENING" ]; then
  echo "⛔ ERROR: Weakening TypeScript config is not allowed."
  echo ""
  echo "Detected lines:"
  echo "$TS_CONFIG_WEAKENING"
  exit 1
fi
