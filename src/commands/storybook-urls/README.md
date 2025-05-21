# storybook-urls

A CLI tool that scans a directory for Storybook stories and generates a JSON array of Storybook URLs.

## Usage

```bash
vibe storybook-urls [options]
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--path <path>` | `-p` | Directory path to scan for story files | `.` (current directory) |
| `--extensions <extensions>` | `-e` | Comma-separated list of file extensions to scan | `.stories.tsx,.stories.jsx,.stories.ts,.stories.js,.stories.mdx` |
| `--port <port>` | `-P` | Storybook server port | Auto-detected from config or `6006` |
| `--output <o>` | `-o` | Output file path (default: print to console) | - |
| `--pretty` | - | Pretty print the JSON output | `false` |
| `--filter <filter>` | `-f` | Filter stories by pattern | - |
| `--frame-url` | - | Generate iframe URLs instead of story URLs | `false` |
| `--progress` | - | Show progress indicator for large codebases | `false` |

## Storybook Configuration Detection

The command automatically looks for Storybook configuration in the following locations:

- `.storybook` directory
- `storybook` directory
- `.config/storybook` directory
- Configuration files like `.storybook/main.js`, `.storybook/main.ts`, etc.

If a configuration is found, the command will attempt to detect the port from the configuration. If a port is specified via the command line option, it will override the detected port.

## Output Format

The command generates a JSON array of Storybook URLs. Each URL points to a specific story in your Storybook instance:

```json
[
  "http://localhost:6006/?path=/story/components-button--primary",
  "http://localhost:6006/?path=/story/components-button--secondary",
  "http://localhost:6006/?path=/story/components-input--default"
]
```

When using the `--frame-url` option, the URLs will point directly to the iframe containing the story:

```json
[
  "http://localhost:6006/iframe.html?id=components-button--primary&viewMode=story",
  "http://localhost:6006/iframe.html?id=components-button--secondary&viewMode=story",
  "http://localhost:6006/iframe.html?id=components-input--default&viewMode=story"
]
```

## Examples

### Basic Usage

Generate a JSON array of all Storybook URLs with automatic configuration detection:

```bash
vibe storybook-urls
```

### Generate URLs from a Specific Directory

```bash
vibe storybook-urls --path ./src/components
```

### Use a Custom Port for the Storybook Server

```bash
vibe storybook-urls --port 9001
```

### Save Output to a File

```bash
vibe storybook-urls --output storybook-urls.json
```

### Pretty Print the JSON Output

```bash
vibe storybook-urls --pretty
```

### Filter Stories by Pattern

```bash
vibe storybook-urls --filter "Button"
```

### Generate iframe URLs

Useful for direct embedding or testing:

```bash
vibe storybook-urls --frame-url
```

### Show Progress Indicator for Large Codebases

```bash
vibe storybook-urls --progress
```

### Combined Options

Generate a filtered, pretty-printed list of iframe URLs from a specific directory and save to a file:

```bash
vibe storybook-urls --path ./src/components --filter "Button" --pretty --frame-url --output button-iframe-urls.json
```

Filter form-related components and output with pretty formatting:

```bash
vibe storybook-urls --filter "Form" --pretty
```

## Troubleshooting

### No Stories Found

If the command doesn't find any stories:

1. Verify the correct directory is being scanned with `--path`
2. Check if your story files use the expected extensions (use `--extensions` to specify custom extensions)
3. Ensure your stories follow the Storybook CSF (Component Story Format) structure

### Port Configuration Issues

If the command is using the wrong port:

1. Specify the port explicitly with `--port`
2. Check your Storybook configuration for the correct port setting

### Large Codebase Performance

For very large codebases with many story files:

1. Use the `--progress` flag to display a progress indicator
2. Consider scanning specific subdirectories using the `--path` option to limit the scope
3. If experiencing memory issues, try running with Node.js flags to increase memory limits: `NODE_OPTIONS=--max-old-space-size=4096 vibe storybook-urls`