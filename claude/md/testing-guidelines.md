## Testing Guidelines

- Pure and utility functions **must** have matching `original-name.test.ts` files
- Place test files **in the same directory** as the code being tested
- Use **Vitest** for all unit tests
- Focus tests on **business logic**, **data transformations**, and **edge cases**
- Always test **error handling paths**
- **Mock external dependencies** only when necessary — prefer testing real behavior
- Keep tests **small, focused, and independent**
- Use **descriptive test names** that clearly state the expected behavior
- Structure tests using **Arrange → Act → Assert** pattern

### Additional Rules

- ❌ Do **not** test trivial getters, setters, or plain constants
- ✅ Prefer testing **behavior** over implementation details
- ❌ Avoid overly brittle tests — changes to internals shouldn’t break a passing test
