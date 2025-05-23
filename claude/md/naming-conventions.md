## Naming Conventions

### File Structure

- One React component per folder:  
  `index.ts`, `component-name.tsx`, `component-name.stories.tsx` (optional)
- Use `index.ts` for barrel exports (export component + types)

### File Naming

- Components: `kebab-case.tsx`
- Stories: `component-name.stories.tsx`
- Tests: `component-name.test.ts`
- Hooks: `use-xyz.ts`

### Rules

- Match filenames to exported names
- Use lowercase filenames (no PascalCase)
- Keep folders shallow and feature-based
