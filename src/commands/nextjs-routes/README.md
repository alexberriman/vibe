# nextjs-routes

> Analyzes a Next.js app directory and generates a JSON array of application routes as URLs.

## Usage

```bash
vibe nextjs-routes [options]
```

## Options

| Option | Description | Default |
| --- | --- | --- |
| `-p, --path <path>` | Directory path to scan for Next.js routes | `.` (current directory) |
| `-P, --port <port>` | Next.js development server port | `3000` |
| `-o, --output <file>` | Output file path (default: print to console) | - |
| `--pretty` | Pretty print the JSON output | `false` |
| `-f, --filter <pattern>` | Filter routes by pattern | - |
| `-t, --type <type>` | Filter by route type (page, api, all) | `all` |

## Examples

### Basic usage

Scan the current directory for Next.js routes and output the results to the console:

```bash
vibe nextjs-routes
```

### Specify a project directory

Scan a specific Next.js project directory:

```bash
vibe nextjs-routes -p ./my-next-app
```

### Save output to a file

Save the routes to a JSON file:

```bash
vibe nextjs-routes -o routes.json
```

### Pretty-print output

Format the JSON output for better readability:

```bash
vibe nextjs-routes --pretty
```

### Filter routes

Only include routes that match a specific pattern:

```bash
vibe nextjs-routes -f "dashboard"
```

### Filter by route type

Only include page routes or API routes:

```bash
vibe nextjs-routes -t page
vibe nextjs-routes -t api
```

## Output Format

The command outputs a JSON array of route objects, each containing:

```json
[
  {
    "path": "/about",
    "url": "http://localhost:3000/about",
    "type": "page",
    "hasDynamicSegments": false
  },
  {
    "path": "/api/users",
    "url": "http://localhost:3000/api/users",
    "type": "api",
    "hasDynamicSegments": false
  },
  {
    "path": "/posts/[id]",
    "url": "http://localhost:3000/posts/[id]",
    "type": "page",
    "hasDynamicSegments": true
  }
]
```