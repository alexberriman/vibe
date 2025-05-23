<div align="center">

# Vibe ⚡

A collection of CLI tools to enhance my development workflow.

</div>

## 🚀 Quick Start

```bash
# Use without installation
npx @alexberriman/vibe [command] [options]

# Or install globally for frequent use
npm install -g @alexberriman/vibe
vibe [command] [options]
```

## 📋 Commands

| Command                               | Category             | Description                                            |
| ------------------------------------- | -------------------- | ------------------------------------------------------ |
| [`scaffold`](#scaffold)               | 🚀 Project Setup     | Create new projects from pre-configured templates      |
| [`storybook-urls`](#storybook-urls)   | 📱 Route Discovery   | Generate JSON arrays of Storybook story URLs           |
| [`react-routes`](#react-routes)       | 📱 Route Discovery   | Discover all routes in React applications              |
| [`nextjs-routes`](#nextjs-routes)     | 📱 Route Discovery   | Analyze Next.js apps and extract page/API routes       |
| [`server-run`](#server-run)           | 🖥️ Server Management | Orchestrate server lifecycle with automated testing    |
| [`screenshot`](#screenshot)           | 🎨 Visual QA         | Capture high-quality screenshots with device emulation |
| [`dom-audit`](#dom-audit)             | 🎨 Visual QA         | Detect visual and accessibility issues                 |
| [`design-feedback`](#design-feedback) | 🎨 Visual QA         | Get AI-powered design feedback and suggestions         |
| [`tmux`](#tmux)                       | 🖥️ Server Management | Manage tmux sessions with write, read, and ensure     |
| [`openai`](#openai)                   | 🤖 AI Assistance     | Prompt OpenAI/ChatGPT with structured JSON responses   |

## 🔥 Commands

### 🚀 Project Setup

#### `scaffold`
Create new projects from pre-configured templates with intelligent prompts and automatic setup.

```bash
# Interactive mode - choose template and configure project
npx @alexberriman/vibe scaffold

# Quick React project with defaults
npx @alexberriman/vibe scaffold --template vibe-react --output my-app --defaults

# Non-interactive with all options
npx @alexberriman/vibe scaffold \
  --template vibe-react \
  --output ./my-startup \
  --project-name "my-startup" \
  --description "The next big thing in SaaS" \
  --author-name "John Doe" \
  --license MIT

# Preview mode (dry run)
npx @alexberriman/vibe scaffold --template vibe-react --dry-run
```

**Available Templates:**
- **vibe-react** - Modern React application with TypeScript, Vite, Tailwind CSS, Storybook, testing, and comprehensive tooling

**Features:**
- ⚡ Interactive template selection with descriptions
- 📝 Smart prompts with validation (project name, author, license)
- 🔄 Automatic file processing with placeholder replacement
- 📦 Dependency installation and git repository initialization  
- 🎯 Non-interactive mode for CI/automation
- 🔍 Dry run mode for preview without execution
- 🔧 Template development support with configuration system

> 📚 **[Full Documentation](src/commands/scaffold/README.md)** - Complete guide with detailed examples and template creation.

### 📱 Route Discovery

#### `storybook-urls`
Generate JSON arrays of Storybook story URLs for automated testing and quality assurance.

```bash
# Scan current directory for stories
npx @alexberriman/vibe storybook-urls

# Scan custom path with specific port
npx @alexberriman/vibe storybook-urls --path ./src --port 6006

# Generate iframe URLs and filter by pattern
npx @alexberriman/vibe storybook-urls --frame-url --filter "Button*"

# Save to file with pretty formatting
npx @alexberriman/vibe storybook-urls --output stories.json --pretty
```

> 📚 **[Full Documentation](src/commands/storybook-urls/README.md)** - Complete guide with all options and examples.

#### `react-routes`
Discover all routes in your React application and generate testable URLs.

```bash
# Scan React app routes
npx @alexberriman/vibe react-routes

# Custom port and output file
npx @alexberriman/vibe react-routes --port 5173 --output routes.json

# Filter routes by pattern
npx @alexberriman/vibe react-routes --filter "/admin*" --pretty
```

> 📚 **[Full Documentation](src/commands/react-routes/README.md)** - Complete guide with all options and examples.

#### `nextjs-routes`
Analyze Next.js applications and extract both page and API routes.

```bash
# Scan all Next.js routes
npx @alexberriman/vibe nextjs-routes

# Filter by route type
npx @alexberriman/vibe nextjs-routes --type page
npx @alexberriman/vibe nextjs-routes --type api

# Custom Next.js port
npx @alexberriman/vibe nextjs-routes --port 3000 --pretty
```

> 📚 **[Full Documentation](src/commands/nextjs-routes/README.md)** - Complete guide with all options and examples.

### 🖥️ Server Management

#### `server-run`
Orchestrate server lifecycle: start, wait for readiness, execute commands, and cleanup.

```bash
# Start server and run tests
npx @alexberriman/vibe server-run \
  --command "npm run dev" \
  --port 3000 \
  --run-command "npm test"

# Custom environment and keep alive
npx @alexberriman/vibe server-run \
  --command "npm start" \
  --url "http://localhost:8080/health" \
  --env "NODE_ENV=test,PORT=8080" \
  --keep-alive

# With custom error and success messages
npx @alexberriman/vibe server-run \
  --command "npm run dev" \
  --port 3000 \
  --run-command "npm run test:e2e" \
  --error-message "❌ Tests failed! Run 'npm run test:e2e:debug' for details." \
  --success-message "✅ All tests passed!"
```

> 📚 **[Full Documentation](src/commands/server-run/README.md)** - Complete guide with all options and examples.

#### `tmux`
Powerful tmux session management with three subcommands: write, read, and ensure.

```bash
# Send text to tmux session
npx @alexberriman/vibe tmux write "npm start" --session dev

# Send special keys
npx @alexberriman/vibe tmux write --keys "ctrl-c,enter" --session dev

# Read session content
npx @alexberriman/vibe tmux read --session dev --lines 100

# Ensure session exists (idempotent)
npx @alexberriman/vibe tmux ensure dev --directory ~/project --command "npm run dev"
```

> 📚 **[Full Documentation](src/commands/tmux/README.md)** - Complete guide with all subcommands and examples.

### 🎨 Visual Quality Assurance

#### `screenshot`
Capture high-quality screenshots of web pages with device emulation.

```bash
# Basic screenshot
npx @alexberriman/vibe screenshot https://example.com

# Custom output and mobile viewport
npx @alexberriman/vibe screenshot https://example.com -o ./screenshots/homepage.png -v mobile

# Advanced screenshot with multiple options
npx @alexberriman/vibe screenshot https://example.com \
  -v tablet \
  --format jpeg \
  --quality 85 \
  -w 2 \
  --wait-for "#main-content"
```

> **Powered by:** [@alexberriman/screenshotter](https://www.npmjs.com/package/@alexberriman/screenshotter) - See package docs for full options and advanced usage.

#### `dom-audit`
Detect visual and accessibility issues in your web applications.

```bash
# Basic audit
npx @alexberriman/vibe dom-audit --url https://example.com

# Mobile viewport with custom output
npx @alexberriman/vibe dom-audit \
  --url https://example.com \
  --viewport mobile \
  --save ./reports/audit.json

# Custom viewport size
npx @alexberriman/vibe dom-audit --url https://example.com --viewport 1366x768
```

> **Powered by:** [@alexberriman/visual-dom-auditor](https://www.npmjs.com/package/@alexberriman/visual-dom-auditor) - See package docs for full options and advanced usage.

#### `design-feedback`
Get AI-powered design feedback and suggestions for UI screenshots.

```bash
# Basic analysis
npx @alexberriman/vibe design-feedback https://example.com

# Mobile viewport analysis
npx @alexberriman/vibe design-feedback https://example.com --viewport mobile

# Custom viewport with JSON output
npx @alexberriman/vibe design-feedback https://example.com \
  --viewport 1024x768 \
  --output screenshot.png \
  --format json
```

> **Powered by:** [@alexberriman/openai-designer-feedback](https://www.npmjs.com/package/@alexberriman/openai-designer-feedback) - See package docs for full options and advanced usage.

### 🤖 AI Assistance

#### `openai`
Prompt OpenAI/ChatGPT with support for system prompts, structured JSON responses, and file inputs.

```bash
# Simple prompt
npx @alexberriman/vibe openai --user "Explain quantum computing in simple terms"

# With system prompt and different model
npx @alexberriman/vibe openai \
  --system "You are a helpful coding assistant" \
  --user "Write a Python function to reverse a string" \
  --model gpt-4

# Structured JSON response
npx @alexberriman/vibe openai \
  --user "Analyze this text sentiment" \
  --json-schema '{"type":"object","properties":{"sentiment":{"type":"string"},"confidence":{"type":"number"}}}'

# File-based prompts
npx @alexberriman/vibe openai --system-file ./system-prompt.txt --user-file ./user-prompt.txt
```

> 📚 **[Full Documentation](src/commands/openai/README.md)** - Complete guide with all options and examples.

## 🛠️ Common Patterns

### Testing Workflow

```bash
# 1. Start your app server
npx @alexberriman/vibe server-run --command "npm run dev" --port 3000 --run-command "
  # 2. Generate all testable URLs
  npx @alexberriman/vibe react-routes --output routes.json &&
  npx @alexberriman/vibe storybook-urls --output stories.json &&

  # 3. Run visual tests
  npx @alexberriman/vibe dom-audit --url-list routes.json
"
```

### Quality Assurance Pipeline

```bash
# Generate routes and audit them
npx @alexberriman/vibe nextjs-routes --pretty > routes.json
cat routes.json | jq -r '.[]' | while read url; do
  npx @alexberriman/vibe screenshot "$url" -o "screenshots/$(basename $url).png"
  npx @alexberriman/vibe dom-audit --url "$url"
done
```

## 🎯 Key Features

- **🔍 Smart Discovery**: Automatically detect and extract routes from popular frameworks
- **⚡ Zero Config**: Works out of the box with sensible defaults
- **🔧 Flexible Output**: JSON arrays, pretty printing, and file output options
- **🚀 Fast Execution**: Optimized for CI/CD pipelines and large projects
- **🎨 Visual Testing**: Integrated screenshot and design feedback capabilities
- **🔄 Server Orchestration**: Reliable server lifecycle management

## 📋 Global Options

Most commands support these common options:

- `--output <file>` (`-o`): Save output to file
- `--pretty`: Pretty print JSON output
- `--filter <pattern>` (`-f`): Filter results by pattern
- `--help`: Show command-specific help

## 🧠 Claude Guidelines

This project includes a collection of modular coding guidelines that can be combined to create project-specific AI assistant configurations. These guidelines ensure consistent, high-quality code generation across different technology stacks.

> 📚 **[Browse Guidelines](claude/md/README.md)** - Select and combine guidelines for your project's needs.

### 📋 Claude Prompts

In addition to guidelines, this project provides specialized prompts for handling specific development tasks:

> 📚 **[Browse Prompts](claude/prompts/README.md)** - Task-specific prompts for error resolution and development workflow.

