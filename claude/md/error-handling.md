## Error Handling

- Handle errors gracefully — never silently fail
- Use `neverthrow` for structured functional error handling
  - Return `Result<T, E>` types instead of throwing exceptions
  - Use `ok()` and `err()` to create Result values
  - Chain operations with `.map()`, `.mapErr()`, `.andThen()`
  - Handle errors explicitly with `.match()` or pattern matching
- For async operations, use `ResultAsync<T, E>` from neverthrow
- Avoid try/catch blocks except at system boundaries
- Always provide clear, descriptive error messages
- Define custom error types for different failure modes
- Avoid `console.error` in production code — surface errors meaningfully
