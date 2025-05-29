#!/bin/bash
# Run test/lint/typecheck suite

echo "🏁 Running unified checks via 'npm run check'..."

if ! npm run check; then
  echo ""
  echo "❌ Pre-commit checks failed (via 'npm run check')."
  echo ""
  echo "💡 Tip: Claude-generated code often includes non-compliant patterns or bypass comments."
  echo "➡️  Review any test, type, or lint issues carefully — and avoid suppressing them with '@ts-ignore' or 'eslint-disable'."
  echo "💬 Feel free to ask for help if you're unsure how to resolve them cleanly."
  exit 1
fi
