## Task Approach

When tackling any task:

- **Think very hard before writing code**  
  Carefully analyze the problem, constraints, and best practices. Use deep reasoning to plan the _best_ approach — this step is critical.
- Break the task into small, logical, high-quality steps
- Prioritize clarity, correctness, and maintainability over speed
- Once you've thought deeply, **begin implementation immediately** — do not output or explain the plan first
- Deliver:
  1. A robust core implementation with proper error handling using `neverthrow`
  2. Well-structured code with clean abstractions and pure functions
  3. Comprehensive tests for all completed functionality
  4. Type-safe interfaces and strong TypeScript types
  5. Safe defaults and basic security practices
- After committing and pushing the task, **stop and wait** — do **not** move on without instruction

### Special Cases

- If building **CLI tools**:  
  Make them intuitive and developer-friendly. Provide helpful error messages, validate inputs early, and follow Unix conventions. Use Commander.js for consistent argument parsing.

- If building **API endpoints**:  
  Design RESTful interfaces with proper HTTP status codes. Use middleware for cross-cutting concerns. Implement proper request validation and error responses.

- If building **utility libraries**:  
  Prioritize composability, reusability, and type safety. Keep functions small, pure, and well-tested. Export both CommonJS and ESM formats when appropriate. Think like a framework author.

- If building **background services**:  
  Design for reliability and observability. Use structured logging with Pino, implement graceful shutdown, and handle all error cases explicitly.