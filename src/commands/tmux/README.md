# tmux Command

A powerful CLI tool for tmux session management with three main subcommands: `write`, `read`, and `ensure`.

## Installation

This command is part of the vibe CLI toolkit. Make sure you have tmux installed on your system.

## Usage

```bash
vibe tmux <subcommand> [options]
```

## Subcommands

### `write` - Send input to tmux sessions

Send text or special keys to tmux sessions with support for large text chunking and timing control.

```bash
vibe tmux write [text] [options]
```

#### Options

- `-t, --target <target>` - Target session[:window[:pane]]
- `-s, --session <session>` - Session name
- `-w, --window <window>` - Window name/number
- `-p, --pane <pane>` - Pane number  
- `-k, --keys <keys>` - Send special keys (comma-separated)
- `-c, --chunk <size>` - Chunk size for large text (default: 1000)
- `-d, --delay <ms>` - Delay between chunks in milliseconds (default: 50)
- `-v, --verbose` - Verbose output

#### Special Keys

Supported special keys for the `--keys` option:

- `enter`, `return` - Enter key
- `tab` - Tab key
- `escape` - Escape key
- `space` - Space key
- `backspace` - Backspace key
- `delete` - Delete key
- `up`, `down`, `left`, `right` - Arrow keys
- `home`, `end` - Home/End keys
- `pageup`, `pagedown` - Page Up/Down keys
- `ctrl-c`, `ctrl-d`, `ctrl-z` - Control key combinations

#### Examples

```bash
# Send text to a session
vibe tmux write "echo hello world" --session mysession

# Send text to specific window and pane
vibe tmux write "npm start" --target mysession:0.1

# Send special keys
vibe tmux write --keys "enter" --session mysession
vibe tmux write --keys "ctrl-c,enter" --target mysession:dev

# Send large text with chunking
vibe tmux write "$(cat large-file.txt)" --session mysession --chunk 500 --delay 100

# Verbose output
vibe tmux write "command" --session mysession --verbose
```

### `read` - Read tmux session content

Capture and optionally tidy the contents of tmux session panes.

```bash
vibe tmux read [options]
```

#### Options

- `-t, --target <target>` - Target session[:window[:pane]]
- `-s, --session <session>` - Session name
- `-w, --window <window>` - Window name/number
- `-p, --pane <pane>` - Pane number
- `-l, --lines <count>` - Number of lines to capture (default: 100)
- `-r, --raw` - Output raw content without tidying
- `-v, --verbose` - Verbose output

#### Content Tidying

By default, the read command tidies captured content by:

- Removing trailing whitespace from lines
- Removing consecutive empty lines (keeping only one)
- Removing leading empty lines
- Trimming leading/trailing whitespace from entire content

Use the `--raw` flag to skip tidying and get raw tmux output.

#### Examples

```bash
# Read from a session (default 100 lines)
vibe tmux read --session mysession

# Read specific number of lines
vibe tmux read --target mysession:0.1 --lines 50

# Read raw content without tidying
vibe tmux read --session mysession --raw

# Read with verbose output
vibe tmux read --target mysession --lines 200 --verbose
```

### `ensure` - Idempotent session creation

Check if a tmux session exists and create it if it doesn't. This is idempotent - running it multiple times won't create duplicate sessions.

```bash
vibe tmux ensure <session> [options]
```

#### Options

- `-d, --directory <path>` - Working directory for new session
- `-c, --command <cmd>` - Initial command to run in new session
- `-s, --silent` - No output if session already exists
- `-v, --verbose` - Detailed status reporting

#### Examples

```bash
# Ensure a session exists
vibe tmux ensure mysession

# Create session with specific working directory
vibe tmux ensure dev --directory ~/projects/myapp

# Create session and run initial command
vibe tmux ensure server --command "npm run dev"

# Create session with directory and command
vibe tmux ensure build --directory ~/project --command "npm run build"

# Silent mode (no output if session exists)
vibe tmux ensure logs --silent

# Verbose mode
vibe tmux ensure debug --verbose
```

## Target Specification

All subcommands support flexible target specification:

### Format

- `session` - Target the session's current window and pane
- `session:window` - Target specific window in session
- `session:window:pane` - Target specific pane in specific window

### Using Options vs Target Flag

You can specify targets in two ways:

1. **Using `--target` flag:**
   ```bash
   vibe tmux write "hello" --target mysession:0.1
   ```

2. **Using individual options:**
   ```bash
   vibe tmux write "hello" --session mysession --window 0 --pane 1
   ```

## Error Handling

The tmux command provides clear error messages for common issues:

- **Tmux not installed:** Clear message about tmux availability
- **Session doesn't exist:** Helpful error with session name
- **Invalid target format:** Guidance on correct target syntax
- **Permission issues:** Clear error messages for tmux access problems

## Exit Codes

- `0` - Success
- `1` - Error (with descriptive error message)

## Requirements

- tmux must be installed and available in your PATH
- Node.js 18+ (for the vibe CLI)

## Integration Examples

### Development Workflow

```bash
# Start development session
vibe tmux ensure dev --directory ~/project --command "npm run dev"

# Send commands to development session
vibe tmux write "npm run test" --session dev
vibe tmux write --keys "ctrl-c" --session dev

# Read logs from development session
vibe tmux read --session dev --lines 50
```

### CI/CD Integration

```bash
# Ensure build session exists
vibe tmux ensure build --directory /opt/project --silent

# Run build command
vibe tmux write "npm run build" --session build

# Wait and read build output
sleep 10
vibe tmux read --session build --lines 200 > build.log
```

### Automated Testing

```bash
# Start test session
vibe tmux ensure test --directory ~/project

# Run tests and capture output
vibe tmux write "npm test" --session test
sleep 30
vibe tmux read --session test --raw > test-output.txt
```