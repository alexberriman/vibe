#!/bin/bash
# Prevent modification of ESLint config files (except eslint.config.js)

ESLINT_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.eslintrc\.|eslintrc\.(js|cjs)|bypass-lint|eslint-disable|\.eslintignore' || true)

if [ -n "$ESLINT_FILES" ]; then
  echo "⛔ ERROR: Attempting to commit changes to ESLint configuration files."
  echo "❌ Modifications to ESLint configuration files are not permitted except for eslint.config.js."
  echo ""
  echo "Affected files:"
  echo "$ESLINT_FILES"
  exit 1
fi

ESLINT_DISABLED_FILES=$(git diff --cached -U0 | grep -E '\+.*eslint-disable' || true)

if [ -n "$ESLINT_DISABLED_FILES" ]; then
  echo "⛔ ERROR: eslint-disable comments are not allowed."
  echo ""
  echo "Detected lines:"
  echo "$ESLINT_DISABLED_FILES"
  exit 1
fi

# Block eslintConfig in package.json

ESLINT_PKG_CONFIG=$(git diff --cached -U0 package.json | grep -E '\+.*"eslintConfig":' || true)

if [ -n "$ESLINT_PKG_CONFIG" ]; then
  echo "⛔ ERROR: ESLint config in package.json is not permitted."
  exit 1
fi
