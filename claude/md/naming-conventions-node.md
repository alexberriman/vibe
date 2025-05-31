## Naming Conventions

### File Structure

- One module per folder:  
  `index.ts`, `module-name.ts`, `module-name.test.ts`
- Use `index.ts` for barrel exports (export functions + types)

### File Naming

- Modules: `kebab-case.ts`
- Tests: `module-name.test.ts`
- Utilities: `utility-name.ts`
- Config files: `config-name.ts`
- Type definitions: `types.ts` or `module-name.types.ts`

### Rules

- Match filenames to exported names
- Use lowercase filenames (no PascalCase)
- Keep folders shallow and feature-based
- Group related functionality in subdirectories