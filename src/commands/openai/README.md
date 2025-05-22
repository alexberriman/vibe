# openai command

Prompt OpenAI/ChatGPT with support for system prompts, structured JSON responses, and file inputs.

## Usage

```bash
vibe openai [options]
```

## Prerequisites

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

## Options

- `-m, --model <model>` - OpenAI model to use (default: "gpt-4o-mini")
- `-s, --system <prompt>` - System prompt text
- `--system-file <path>` - Path to file containing system prompt
- `-u, --user <prompt>` - User prompt text (required)
- `--user-file <path>` - Path to file containing user prompt
- `--json-schema <schema>` - JSON schema for structured response
- `--json-schema-file <path>` - Path to file containing JSON schema
- `-f, --format <format>` - Output format: raw, json, pretty (default: pretty)
- `-v, --verbose` - Verbose output for debugging
- `-t, --timeout <seconds>` - Request timeout in seconds (default: 30)
- `--max-tokens <tokens>` - Maximum tokens in response (default: 2048)
- `--temperature <temp>` - Response temperature 0.0-2.0 (default: 0.7)

## Examples

### Basic usage

```bash
# Simple prompt
vibe openai --user "Explain quantum computing in simple terms"

# With system prompt
vibe openai --system "You are a helpful coding assistant" --user "Write a Python function to reverse a string"

# Using different model
vibe openai --model "gpt-4" --user "What is the meaning of life?"
```

### File-based prompts

```bash
# Read prompts from files
vibe openai --system-file ./system-prompt.txt --user-file ./user-prompt.txt

# Mix inline and file prompts
vibe openai --system "You are a code reviewer" --user-file ./code-to-review.js
```

### Structured JSON responses

```bash
# Inline JSON schema
vibe openai --user "Analyze this text sentiment" --json-schema '{"type":"object","properties":{"sentiment":{"type":"string","enum":["positive","negative","neutral"]},"confidence":{"type":"number"}}}'

# Schema from file
vibe openai --user "Extract key information" --json-schema-file ./response-schema.json
```

### Advanced usage

```bash
# High creativity with longer response
vibe openai --user "Write a creative story" --temperature 1.5 --max-tokens 4000

# Verbose debugging
vibe openai --user "Hello" --verbose

# Raw output (no formatting)
vibe openai --user "Give me JSON data" --format raw

# Longer timeout for complex requests
vibe openai --user "Analyze this large dataset" --timeout 120
```

## JSON Schema Support

When using `--json-schema` or `--json-schema-file`, the AI will return a structured JSON response that conforms to your schema.

Example schema file (`response-schema.json`):
```json
{
  "type": "object",
  "properties": {
    "summary": {
      "type": "string",
      "description": "Brief summary of the content"
    },
    "key_points": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of key points"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Confidence score"
    }
  },
  "required": ["summary", "key_points"]
}
```

## Output Formats

- `raw` - Raw response text with no formatting
- `json` - JSON-formatted output (useful for piping to other tools)
- `pretty` - Pretty-printed output with proper formatting (default)

## Error Handling

The command handles various error scenarios:
- Missing API key
- Invalid JSON schema
- API rate limits and errors
- Network timeouts
- File reading errors

Use `--verbose` for detailed error information and debugging.

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)

## Tips

1. **System prompts** help set the AI's behavior and context
2. **JSON schemas** ensure consistent structured output
3. **Temperature** controls randomness (0.0 = deterministic, 2.0 = very creative)
4. **File inputs** are useful for large prompts or reusable content
5. Use **verbose mode** to debug API issues and monitor token usage