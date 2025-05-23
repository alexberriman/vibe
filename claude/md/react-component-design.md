## Component Design

- One component per file (`kebab-case.tsx`)
- Use named function declarations (`function MyComponent() {}`), not arrow functions
- Create adjacent Storybook file: `component-name.stories.tsx`
- Name properties interface `ComponentNameProperties`
- Destructure properties with defaults at the top
- No tests required for UI/presentational components
- Use `children` and support `className`, `...properties` passthrough
- Separate smart (logic) and dumb (presentational) components
- Smart components must reuse dumb components (`<Button />` not `<button>`)
- Avoid prop drilling — use context where needed
- Prefer composition over inheritance
- Ensure accessibility: keyboard nav, ARIA, labels

### Visual & Animation

- Components must look 🔥 — clean, modern, minimal
- No glassmorphism or visual gimmicks
- Use **Framer Motion** for subtle animation, toggle via property (`animated={false}`)

### Performance

- Use `React.memo` if properties are stable
- Use `useCallback`/`useMemo` to avoid unnecessary re-renders
- Avoid inline functions/objects in JSX
- Lazy-load **non-critical** components with `React.lazy` + `Suspense`  
  _Don’t lazy-load small, frequently-used components_
- Use stable keys for lists; avoid reindexing
- Batch state updates
- Virtualize long lists when needed
