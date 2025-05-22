# DOM Audit Command

A wrapper for the `@alexberriman/visual-dom-auditor` package that helps detect visual and layout issues on web pages.

## Usage

```bash
vibe dom-audit [options]
```

This command functions as a pass-through to the `@alexberriman/visual-dom-auditor` package with enhanced error handling for CI/CD workflows.

## Options

### Enhanced Options

- `--no-fail`: Always exit with success code (0) even if critical issues are found
- `--error-message <message>`: Custom error message when critical issues are detected

### Underlying Package Options

All options from the `@alexberriman/visual-dom-auditor` package are supported. Common options include:

- `--url <url>`: The URL to audit
- `--headless`: Run in headless mode
- `--format <format>`: Output format (json, console, etc.)
- `--output <file>`: Save results to a file

## Exit Behavior

By default, the command will:
- Exit with code 0 (success) when no critical issues are found
- Exit with code 1 (failure) when critical issues are detected

This makes it perfect for CI/CD pipelines where you want to fail builds when critical DOM issues are present.

## Examples

Basic audit (fails on critical issues):

```bash
vibe dom-audit --url https://example.com
```

Audit with custom error message for CI:

```bash
vibe dom-audit --url https://example.com --error-message "❌ Build failed: Critical DOM issues detected!"
```

Audit that never fails (for reporting only):

```bash
vibe dom-audit --url https://example.com --no-fail
```

## How It Works

This command:

1. Captures all provided arguments and forwards them to `@alexberriman/visual-dom-auditor`
2. Intercepts the JSON output to check for critical issues
3. Displays the original output to the user
4. Exits with code 1 if critical issues are found (unless `--no-fail` is used)
5. Allows custom error messages for better CI/CD integration