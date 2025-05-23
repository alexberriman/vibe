## Dos and Don'ts

### ✅ DO

- Write small, reusable, and pure functions
- Break large functions/components into smaller, focused units
- Limit to one React component per file
- Fix all ESLint and TypeScript errors properly
- Follow naming conventions consistently
- Use robust error handling (no silent failures)

### ❌ DON'T

- ❌ Do _not_ bypass Husky hooks using `--no-verify`
- ❌ Do _not_ use `// eslint-disable` or `// @ts-ignore` — fix the root cause
- ❌ Do _not_ modify ESLint or Husky configs to suppress errors
- ❌ Do _not_ destructure to omit object props — use the `omit()` utility instead
