# ✅ TODO.md – Vibe tools

A collection of CLI tools to enhance my coding workflow.

---

## storybook-urls command

Create a CLI tool that scans a directory for Storybook stories and generates a JSON array of Storybook URLs.

### Core Functionality

[✅] Set up the command structure (`commands/storybook-urls/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create directory scanning utility that respects .gitignore patterns
[✅] Develop Storybook configuration detector to find .storybook directory or config files
[✅] Build file extension filter to identify story files (.stories.tsx, .stories.ts, .stories.jsx, .stories.js, etc.)
[✅] Create parsers for both TypeScript and JavaScript story files
[✅] Implement shared parser logic with format-specific adaptations
[✅] Implement URL generator for both regular and frame URLs
[✅] Add port detection or configuration (default: 6006)
[✅] Build JSON output formatter
[✅] Implement pretty-print option for formatted output
[✅] Add filtering options (by component type, file path, etc.)
[✅] Create progress indicator for large codebases
[✅] Add option to save output to file (default: print to console)
[✅] Create detailed command README.md with usage examples

---

## server-run command

Create a CLI tool that spins up a server (e.g., Storybook, dev server), waits for it to be ready, runs commands against it, and then tears it down.

### Core Functionality

[✅] Set up the command structure (`commands/server-run/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create server launcher with configurable start command
[✅] Implement URL/port availability detection
[✅] Add polling mechanism to wait for server readiness
[✅] Create command runner to execute tasks against running server
[✅] Implement server teardown process
[✅] Add timeout configuration and handling
[✅] Implement proper process signal handling (SIGINT, SIGTERM)
[✅] Add error handling for server startup failures
[✅] Implement server output parsing to detect error patterns
[✅] Add detection for stalled processes that show no progress
[✅] Create smart timeout system that differentiates between "still starting" and "error state"
[✅] Implement error capture and formatting for detailed reporting
[✅] Create support for environment variable passing
[✅] Add logging with different verbosity levels
[✅] Add option to keep server running after command completion
[✅] Create detailed command README.md with usage examples

---

## react-routes command

Create a CLI tool that analyzes a React app directory and generates a JSON array of application routes as URLs.

### Core Functionality

[✅] Set up the command structure (`commands/react-routes/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create directory scanning utility that respects .gitignore patterns
[✅] Implement Vite configuration detector to find port settings (default: 5173)
[✅] Create React Router detection logic (find router definition files in both TS and JS)
[✅] Build parser for JSX-style routes that handles both TSX and JSX syntax
[✅] Implement parser for object-based routes with support for TS and JS differences
[✅] Add support for data router API with TypeScript generics and JavaScript implementations
[✅] Handle nested route extraction and path building
[✅] Create system for handling dynamic route parameters (e.g., `/users/:id`)
[✅] Develop base URL construction with correct protocol, host, and port
[✅] Build modular router detection system for future expansions
[✅] Build JSON output formatter
[✅] Implement pretty-print option for formatted output
[✅] Add option to save output to file (default: print to console)
[✅] Add option to filter routes by pattern
[✅] Create detailed command README.md with usage examples

---

## nextjs-routes command

Create a CLI tool that analyzes a Next.js app directory and generates a JSON array of application routes as URLs.

### Core Functionality

[✅] Set up the command structure (`commands/nextjs-routes/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create directory scanning utility that respects .gitignore patterns
[✅] Implement Next.js project structure detection (identify app router and/or pages router)
[✅] Develop Next.js configuration detector to find port settings (default: 3000)
[✅] Build file system analyzer for app router directory structure
[✅] Create file system analyzer for pages router directory structure
[ ] Implement special file detection (page.js/tsx, layout.js/tsx, route.js/tsx)
[ ] Create parser for app router route groups (folders with parentheses)
[ ] Add support for parallel routes (folders with @ prefix)
[ ] Build handler for dynamic route segments ([param], [...catchAll], [[...optionalCatchAll]])
[ ] Create path builder that correctly handles route groups and dynamic segments
[ ] Add support for API routes detection (app/api and pages/api)
[ ] Develop metadata extraction from route files where possible
[ ] Implement URL generator with correct base URL and paths
[ ] Add support for Next.js middleware and rewrites detection if present
[ ] Build JSON output formatter with route details
[ ] Implement pretty-print option for formatted output
[ ] Add option to save output to file (default: print to console)
[ ] Add options to filter routes by pattern or type (page routes, API routes)
[✅] Create detailed command README.md with usage examples

---

## dom-audit command

Create a simple wrapper for the @alexberriman/visual-dom-auditor package.

### Core Functionality

[✅] Set up the command structure (`commands/dom-audit/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create direct wrapper for npx @alexberriman/visual-dom-auditor
[✅] Pass through all command-line arguments to the underlying package
[✅] Add command documentation to README.md

---

## screenshot command

Create a simple wrapper for the @alexberriman/screenshotter package.

### Core Functionality

[✅] Set up the command structure (`commands/screenshot/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create direct wrapper for npx @alexberriman/screenshotter
[✅] Pass through all command-line arguments to the underlying package
[✅] Add command documentation to README.md

---

## design-feedback command

Create a simple wrapper for the @alexberriman/openai-designer-feedback package.

### Core Functionality

[✅] Set up the command structure (`commands/design-feedback/`)
[✅] Implement basic CLI argument handling using Commander.js
[✅] Create direct wrapper for npx @alexberriman/openai-designer-feedback
[✅] Pass through all command-line arguments to the underlying package
[✅] Add command documentation to README.md