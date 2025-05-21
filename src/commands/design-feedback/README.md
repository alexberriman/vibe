# Design Feedback Command

A wrapper for the `@alexberriman/openai-designer-feedback` package that provides AI-powered design feedback for UI screenshots and mockups.

## Usage

```bash
vibe design-feedback [options]
```

This command functions as a direct pass-through to the `@alexberriman/openai-designer-feedback` package. All options and arguments are forwarded to the underlying package.

## Options

All options from the `@alexberriman/openai-designer-feedback` package are supported. Refer to the original package documentation for details.

Common options include:

- `--image <path>`: Path to the UI screenshot or design mockup
- `--prompt <text>`: Custom prompt to guide the AI feedback
- `--output <file>`: Save feedback to a file
- `--model <name>`: Specify the AI model to use
- `--verbose`: Enable detailed output

## Examples

Get design feedback for a screenshot:

```bash
vibe design-feedback --image ui-screenshot.png
```

Save feedback to a file:

```bash
vibe design-feedback --image ui-mockup.png --output feedback.md
```

Use a custom prompt for specific feedback:

```bash
vibe design-feedback --image ui-design.png --prompt "Focus on accessibility improvements"
```

## How It Works

This command is a simple wrapper that:

1. Captures all provided arguments
2. Forwards them to `npx @alexberriman/openai-designer-feedback`
3. Inherits all output from the underlying package
4. Preserves the exit code from the underlying process