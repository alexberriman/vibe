## Task Approach

When tackling any task:

- **Think very hard before writing code**  
  Carefully analyze the problem, constraints, and best practices. Use deep reasoning to plan the _best_ approach — this step is critical.
- Break the task into small, logical, high-quality steps
- Prioritize clarity, correctness, and maintainability over speed
- Once you've thought deeply, **begin implementation immediately** — do not output or explain the plan first
- Deliver:
  1. A robust core implementation with proper error handling
  2. Well-structured code and clean abstractions
  3. Tests for all completed functionality
  4. Safe defaults and basic security practices
- After committing and pushing the task, **stop and wait** — do **not** move on without instruction

### Special Cases

- If building **UI components**:  
  Make them 🔥 — clean, modern, elegant, and visually impressive.  
  Use **subtle, thoughtful animations** (e.g. via Framer Motion), but **ensure all animations can be toggled via a prop** (e.g. `animated={false}`).  
  **No glassmorphism or overused visual effects** — we’re building a world-class interface.

- If building **library or utility code**:  
  Prioritize composability, reusability, and type safety. Keep functions small, pure, and well-tested. Think like a framework author.
