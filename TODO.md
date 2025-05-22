# ✅ TODO.md – Vibe tools

A collection of CLI tools to enhance my coding workflow.

---

## nextjs-routes command

Create a CLI tool that analyzes a Next.js app directory and generates a JSON array of application routes as URLs.

### Core Functionality

- [✅] Set up the command structure (`commands/nextjs-routes/`)
- [✅] Implement basic CLI argument handling using Commander.js
- [✅] Create directory scanning utility that respects .gitignore patterns
- [✅] Implement Next.js project structure detection (identify app router and/or pages router)
- [✅] Develop Next.js configuration detector to find port settings (default: 3000)
- [✅] Build file system analyzer for app router directory structure
- [✅] Create file system analyzer for pages router directory structure
- [✅] Implement special file detection (page.js/tsx, layout.js/tsx, route.js/tsx)
- [✅] Create parser for app router route groups (folders with parentheses)
- [✅] Add support for parallel routes (folders with @ prefix)
- [✅] Build handler for dynamic route segments ([param], [...catchAll], [[...optionalCatchAll]])
- [✅] Create path builder that correctly handles route groups and dynamic segments
- [✅] Add support for API routes detection (app/api and pages/api)
- [✅] Develop metadata extraction from route files where possible
- [✅] Implement URL generator with correct base URL and paths
- [ ] Add support for Next.js middleware and rewrites detection if present
- [✅] Build JSON output formatter with route details
- [✅] Implement pretty-print option for formatted output
- [✅] Add option to save output to file (default: print to console)
- [✅] Add options to filter routes by pattern or type (page routes, API routes)
- [✅] Create detailed command README.md with usage examples
- [✅] Update root README.md with nextjs-routes command information

---

## ✅ tmux command

Create a CLI tool with subcommands for tmux session management (write, read, ensure).

### Core Functionality

- [✅] Set up the command structure (`commands/tmux/`)
- [✅] Implement main tmux command with subcommand routing using Commander.js
- [✅] Create shared tmux utilities for session validation and error handling

#### tmux write subcommand

Send input to a tmux session with support for chunked large strings and specific keystrokes.

- [✅] Implement tmux write subcommand CLI argument handling
- [✅] Create tmux session detection and validation
- [✅] Implement string chunking for large input blocks
- [✅] Add support for sending specific keystrokes (Enter, Ctrl+C, etc.)
- [✅] Create timing/delay functionality for waiting between sends
- [✅] Build input sanitization to handle special characters
- [✅] Add session target specification (session name or window:pane)

#### tmux read subcommand

Read and tidy the contents of a tmux session pane.

- [✅] Implement tmux read subcommand CLI argument handling
- [✅] Create tmux session/pane content capture functionality
- [✅] Add configurable line count option (default: 100 lines)
- [✅] Implement content tidying features:
  - [✅] Remove empty/blank lines
  - [✅] Trim unnecessary whitespace
  - [✅] Remove duplicate consecutive empty lines
- [✅] Add session target specification (session name or window:pane)
- [✅] Implement raw output option (skip tidying)

#### tmux ensure subcommand

Check if a tmux session exists and create it if it doesn't (idempotent session creation).

- [✅] Implement tmux ensure subcommand CLI argument handling
- [✅] Create tmux session existence check functionality
- [✅] Implement session creation with configurable options:
  - [✅] Session name specification
  - [✅] Working directory option
  - [✅] Initial command to run in session
- [✅] Add silent mode (no output if session already exists)
- [✅] Implement verbose mode for detailed status reporting
- [✅] Create exit codes (0: session exists/created, 1: error)
- [✅] Update root README.md with tmux command information

---

## openai command

Create a CLI tool for prompting OpenAI/ChatGPT with support for system prompts, user prompts, model selection, and structured JSON responses.

### Core Functionality

- [✅] Set up the command structure (`commands/openai/`)
- [✅] Implement basic CLI argument handling using Commander.js
- [✅] Add OpenAI SDK dependency and configuration
- [✅] Create API key handling (environment variable or config file)
- [✅] Implement model selection with default to gpt-4o-mini
- [✅] Add system prompt specification (via argument or file)
- [✅] Add user prompt specification (via argument or file)
- [✅] Implement structured response support:
  - [✅] JSON schema input handling (via argument or file)
  - [✅] Response validation and error handling
- [✅] Create response formatting options:
  - [✅] Raw response output
  - [✅] Pretty-printed JSON output
  - [✅] Parsed structured output display
- [✅] Add error handling for API failures and rate limits
- [✅] Implement timeout and retry logic
- [✅] Add verbose mode for debugging API calls
- [✅] Create detailed command README.md with usage examples
- [ ] Update root README.md with openai command information
