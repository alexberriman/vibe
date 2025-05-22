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

The command outputs a JSON object containing route information and metadata:

```json
{
  "scannedDirectory": ".",
  "baseUrl": "http://localhost:3000",
  "routesFound": 3,
  "totalRoutesFound": 3,
  "structure": {
    "hasAppRouter": true,
    "hasPagesRouter": false,
    "appDirectory": "/path/to/app",
    "pagesDirectory": null
  },
  "routes": [
    {
      "path": "/about",
      "url": "http://localhost:3000/about",
      "type": "page",
      "fileType": "page",
      "hasDynamicSegments": false,
      "source": "app",
      "isClientComponent": true,
      "isServerComponent": false,
      "metadata": {
        "hasDefaultExport": true,
        "namedExports": [],
        "isClientComponent": true,
        "isServerComponent": false,
        "hasMiddleware": false,
        "imports": ["react", "@next/font"],
        "directives": ["use client"],
        "errorHandling": false,
        "dataFetching": []
      }
    },
    {
      "path": "/api/users",
      "url": "http://localhost:3000/api/users",
      "type": "api",
      "fileType": "route",
      "hasDynamicSegments": false,
      "source": "app",
      "isClientComponent": false,
      "isServerComponent": true,
      "metadata": {
        "httpMethods": ["GET", "POST"],
        "hasDefaultExport": false,
        "namedExports": ["GET", "POST"],
        "isClientComponent": false,
        "isServerComponent": true,
        "hasMiddleware": true,
        "imports": ["next/server"],
        "directives": [],
        "errorHandling": true,
        "dataFetching": ["fetch"]
      }
    },
    {
      "path": "/posts/[id]",
      "url": "http://localhost:3000/posts/[id]",
      "type": "page",
      "fileType": "page",
      "hasDynamicSegments": true,
      "source": "app",
      "isClientComponent": false,
      "isServerComponent": true,
      "metadata": {
        "hasDefaultExport": true,
        "namedExports": ["generateMetadata", "generateStaticParams"],
        "isClientComponent": false,
        "isServerComponent": true,
        "hasMiddleware": false,
        "imports": ["next"],
        "directives": [],
        "errorHandling": false,
        "dataFetching": ["generateMetadata", "generateStaticParams", "fetch"]
      }
    }
  ]
}
```

## Route Metadata

Each route includes rich metadata extracted from the source files:

### Core Properties
- `hasDefaultExport`: Whether the file has a default export
- `namedExports`: Array of named exports (functions, constants)
- `isClientComponent`: Has "use client" directive
- `isServerComponent`: Is a server component (default in App Router)
- `directives`: All "use ..." directives found in the file

### API Route Specific
- `httpMethods`: HTTP methods exported (GET, POST, PUT, DELETE, etc.)
- `hasMiddleware`: Uses Next.js middleware (NextRequest, NextResponse)

### Data Fetching
- `dataFetching`: Detected data fetching patterns:
  - `fetch` - Uses fetch() API
  - `getServerSideProps` - Pages Router server-side data fetching
  - `getStaticProps` - Pages Router static generation
  - `getStaticPaths` - Pages Router dynamic route pre-generation
  - `generateMetadata` - App Router metadata generation
  - `generateStaticParams` - App Router static params generation

### Error Handling
- `errorHandling`: Detects error boundaries, try/catch blocks, error.tsx files

### Imports
- `imports`: Key framework and library imports (excludes relative imports)