# Vibe 🎵

A collection of powerful CLI tools to supercharge your development workflow with intelligent route discovery, automated testing, and visual quality assurance.

## 🚀 Quick Start

```bash
# Use without installation
npx @alexberriman/vibe [command] [options]

# Or install globally for frequent use
npm install -g @alexberriman/vibe
vibe [command] [options]
```

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

### 🎨 Visual Quality Assurance

#### `screenshot`
Capture high-quality screenshots of web pages with device emulation.

```bash
# Basic screenshot
npx @alexberriman/vibe screenshot --url https://example.com

# Full page screenshot with specific device
npx @alexberriman/vibe screenshot \
  --url https://example.com \
  --fullpage \
  --device "iPhone 12"
```

#### `dom-audit`
Detect visual and accessibility issues in your web applications.

```bash
# Audit a webpage
npx @alexberriman/vibe dom-audit --url https://example.com

# Headless mode with custom output
npx @alexberriman/vibe dom-audit \
  --url https://example.com \
  --headless \
  --format json \
  --output audit-report.json
```

#### `design-feedback`
Get AI-powered design feedback and suggestions for UI screenshots.

```bash
# Analyze a screenshot
npx @alexberriman/vibe design-feedback --image ./screenshot.png

# Custom prompt and model
npx @alexberriman/vibe design-feedback \
  --image ./design.png \
  --prompt "Focus on accessibility and mobile usability" \
  --model 4
```

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
  npx @alexberriman/vibe screenshot --url "$url" --output "screenshots/$(basename $url).png"
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

## 🤝 Contributing

Feel free to suggest improvements or report issues through Pull Requests.

## 📄 License

MIT