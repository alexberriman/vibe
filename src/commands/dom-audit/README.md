# DOM Audit Command

A wrapper for the `@alexberriman/visual-dom-auditor` package that helps detect visual and layout issues on web pages.

## Usage

```bash
vibe dom-audit [options]
```

This command functions as a direct pass-through to the `@alexberriman/visual-dom-auditor` package. All options and arguments are forwarded to the underlying package.

## Options

All options from the `@alexberriman/visual-dom-auditor` package are supported. Refer to the original package documentation for details.

Common options include:

- `--url <url>`: The URL to audit
- `--headless`: Run in headless mode
- `--format <format>`: Output format (json, console, etc.)
- `--output <file>`: Save results to a file

## Examples

Audit a website in headless mode:

```bash
vibe dom-audit --url https://example.com --headless
```

Save audit results to a JSON file:

```bash
vibe dom-audit --url https://example.com --format json --output results.json
```

## How It Works

This command is a simple wrapper that:

1. Captures all provided arguments
2. Forwards them to `npx @alexberriman/visual-dom-auditor`
3. Inherits all output from the underlying package
4. Preserves the exit code from the underlying process