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
| `--extensions <extensions>` | `-e` | Comma-separated list of file extensions to scan | `.stories.tsx,.stories.jsx,.stories.ts,.stories.js` |
| `--port <port>` | `-P` | Storybook server port | Auto-detected from config or `6006` |
| `--output <output>` | `-o` | Output file path (default: print to console) | - |
| `--pretty` | - | Pretty print the JSON output | `false` |
| `--filter <filter>` | `-f` | Filter stories by pattern | - |

## Storybook Configuration Detection

The command automatically looks for Storybook configuration in the following locations:

- `.storybook` directory
- `storybook` directory
- `.config/storybook` directory
- Configuration files like `.storybook/main.js`, `.storybook/main.ts`, etc.

If a configuration is found, the command will attempt to detect the port from the configuration. If a port is specified via the command line option, it will override the detected port.

## Examples

### Generate a JSON array of all Storybook URLs with automatic configuration detection

```bash
vibe storybook-urls
```

### Generate URLs from a specific directory

```bash
vibe storybook-urls --path ./src/components
```

### Use a custom port for the Storybook server

```bash
vibe storybook-urls --port 9001
```

### Save output to a file

```bash
vibe storybook-urls --output storybook-urls.json
```

### Pretty print the JSON output

```bash
vibe storybook-urls --pretty
```

### Filter stories by pattern

```bash
vibe storybook-urls --filter "Button"
```