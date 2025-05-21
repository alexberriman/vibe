@CLAUDE-CUSTOM.md
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of Node.js CLI tools to enhance my coding workflow.

## Code Style Conventions

- **Case Style**: kebab-case
- **Indentation**: spaces (2 spaces)
- **Quotes**: double quotes
- **Line Length**: Maximum 100 characters
- **Trailing Commas**: Use trailing commas
- **Semicolons**: Use semicolons

### Command Structure

Commands should be organized in directories with an index.ts file.
Example:
```
commands/
  example-command/
    index.ts                # Exports the command
    example-command.ts      # Command implementation
    README.md               # Command documentation
    example-command.test.ts # Tests (adjacent to implementation)
```

### Test Files

Test files should follow the pattern: `{name}.test.ts`

## Preferred Technologies

Use the following technologies in this project:

### CLI

- **Language**: TypeScript
- **Framework**: Commander.js
- **Error Handling**: Functional approach

### Code Organization & Architecture

- **Command Design**: Maximize reusability
  - Create small, composable, reusable functions
  - Extract common patterns into shared utilities
  - Build a command hierarchy that promotes reuse
- **Command Documentation**: Every command must have a README.md
  - Documentation should cover usage, options, and examples
  - Include proper documentation of input/output
- **Utility Organization**: One utility per file
  - Each utility function should have its own dedicated file or be grouped logically
  - Organize utilities by purpose/function

### Testing

- **Unit Testing**: Vitest
  - Leveraging Vite for fast test execution
  - Do NOT use Jest configuration or dependencies
- **Test Location**: Tests should be placed adjacent to implementation files
  - Do NOT use __tests__ directories

### Build Tools

- **Bundler**: Tsup
- **CI/CD**: github-actions

## Project Architecture

Follow a clear separation of concerns between CLI commands. Use well-defined interfaces for communication.

## CLI Architecture

This CLI tool follows these architectural principles:

- **Command-line Interface**: Uses Commander.js for argument parsing
- **TypeScript**: Strong typing throughout the codebase
- **Modular Design**: Separate concerns into focused modules
- **Pure Functions**: Maximize testability with pure functions

## Module Structure

The project should be organized as follows:

```
src/
  index.ts          # CLI entry point (#!/usr/bin/env node)
  commands/         # Individual CLI commands
    command-a/      # Command-specific directory
      index.ts      # Exports the command
      command-a.ts  # Command implementation
      README.md     # Command documentation
      command-a.test.ts  # Command tests
    command-b/      # Another command directory
      index.ts      # Exports the command
      command-b.ts  # Command implementation
      README.md     # Command documentation
      command-b.test.ts  # Command tests
  types/            # TypeScript type definitions
    index.ts
    options.ts
  utils/            # Utility functions
    file-helpers.ts
    formatting.ts
  config/           # Configuration handling
    defaults.ts
```

## Error Handling Guidelines

When implementing error handling:

- Provide descriptive error messages
- Never silence errors
- Exit with appropriate exit codes (0 for success, 1 for errors)
- Use console.error for error output
- Use console.log for success output