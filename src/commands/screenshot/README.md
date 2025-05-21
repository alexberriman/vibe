# Screenshot Command

A wrapper for the `@alexberriman/screenshotter` package that helps capture screenshots of web pages.

## Usage

```bash
vibe screenshot [options]
```

This command functions as a direct pass-through to the `@alexberriman/screenshotter` package. All options and arguments are forwarded to the underlying package.

## Options

All options from the `@alexberriman/screenshotter` package are supported. Refer to the original package documentation for details.

Common options include:

- `--url <url>`: The URL to screenshot
- `--output <file>`: Save screenshot to a file
- `--format <format>`: Image format (png, jpeg, etc.)
- `--fullpage`: Capture the full page height
- `--width <width>`: Set viewport width
- `--height <height>`: Set viewport height
- `--device <device>`: Use preset device dimensions

## Examples

Take a screenshot of a website:

```bash
vibe screenshot --url https://example.com --output screenshot.png
```

Capture a full-page screenshot:

```bash
vibe screenshot --url https://example.com --fullpage --output fullpage.png
```

Use a mobile device preset:

```bash
vibe screenshot --url https://example.com --device "iPhone 13" --output mobile.png
```

## How It Works

This command is a simple wrapper that:

1. Captures all provided arguments
2. Forwards them to `npx @alexberriman/screenshotter`
3. Inherits all output from the underlying package
4. Preserves the exit code from the underlying process