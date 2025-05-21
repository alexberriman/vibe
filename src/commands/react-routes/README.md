# React Routes Command

A CLI command that analyzes a React app directory and generates a JSON array of application routes as URLs.

## Usage

```bash
vibe react-routes [options]
```

## Options

- `-p, --path <path>`: Directory path to scan for React router files (default: current directory)
- `-P, --port <port>`: Development server port (default: 5173)
- `-o, --output <output>`: Output file path (default: print to console)
- `--pretty`: Pretty print the JSON output
- `-f, --filter <filter>`: Filter routes by pattern
- `-e, --extensions <extensions>`: Comma-separated list of file extensions to scan (default: .tsx,.jsx,.ts,.js)

## Examples

```bash
# Generate routes for the current directory
vibe react-routes

# Generate routes for a specific React app
vibe react-routes -p /path/to/my-react-app

# Generate routes and save to a file with pretty formatting
vibe react-routes -p /path/to/my-react-app --pretty -o routes.json

# Use a custom port for URL generation
vibe react-routes -P 3000

# Only include routes that match a pattern
vibe react-routes -f "user"

# Scan only specific file extensions
vibe react-routes -e ".tsx,.jsx"
```

## Output Format

The command outputs a JSON array of strings, where each string is a URL to a route in the React application.

Example:

```json
[
  "http://localhost:5173/",
  "http://localhost:5173/about",
  "http://localhost:5173/users",
  "http://localhost:5173/users/:id"
]
```