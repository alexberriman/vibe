## Error Handling

- Handle errors gracefully — never silently fail
- Use `async/await` (not `.then()`/`.catch()`)
- Prefer `try {}` / `catch {}` when the error variable isn't needed  
  _Avoid `catch (e)` if `e` is unused — it will trigger lint errors_
- Always provide clear, descriptive error messages
- Use `ts-results` or `Result<T, E>` for structured functional error handling
- Avoid `console.error` in production code — surface errors meaningfully
