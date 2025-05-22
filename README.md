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
| [`storybook-urls`](#storybook-urls)   | 📱 Route Discovery   | Generate JSON arrays of Storybook story URLs           |
| [`react-routes`](#react-routes)       | 📱 Route Discovery   | Discover all routes in React applications              |
| [`nextjs-routes`](#nextjs-routes)     | 📱 Route Discovery   | Analyze Next.js apps and extract page/API routes       |
| [`server-run`](#server-run)           | 🖥️ Server Management | Orchestrate server lifecycle with automated testing    |
| [`screenshot`](#screenshot)           | 🎨 Visual QA         | Capture high-quality screenshots with device emulation |
| [`dom-audit`](#dom-audit)             | 🎨 Visual QA         | Detect visual and accessibility issues                 |
| [`design-feedback`](#design-feedback) | 🎨 Visual QA         | Get AI-powered design feedback and suggestions         |

## 🔥 Commands

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
```

> 📚 **[Full Documentation](src/commands/server-run/README.md)** - Complete guide with all options and examples.

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

