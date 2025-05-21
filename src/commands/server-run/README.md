# server-run

A CLI tool that spins up a server (e.g., Storybook, dev server), waits for it to be ready, runs commands against it, and then tears it down.

## Usage

```bash
vibe server-run [options]
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--command <command>` | `-c` | Command to start the server (required) | - |
| `--port <port>` | `-p` | Port to check for availability | - |
| `--url <url>` | `-u` | URL to poll for readiness | - |
| `--timeout <timeout>` | `-t` | Timeout in milliseconds before giving up | 60000 (60 seconds) |
| `--interval <interval>` | `-i` | Interval in milliseconds between readiness checks | 1000 (1 second) |
| `--wait` | `-w` | Wait for server to be ready | `true` |
| `--verbose` | `-v` | Verbose output | `false` |
| `--keep-alive` | `-k` | Keep server running after command execution | `false` |
| `--run-command <command>` | `-r` | Command to run against the server once it's ready | - |
| `--env <env>` | `-e` | Environment variables to pass to the server (format: KEY1=value1,KEY2=value2) | - |

## Examples

### Start Storybook and wait for it to be ready

```bash
vibe server-run --command "npm run storybook" --port 6006
```

### Start a dev server, wait for it to be ready, and run a command against it

```bash
vibe server-run --command "npm run dev" --url "http://localhost:3000" --run-command "npm run test:e2e"
```

### Start a server with a custom timeout and polling interval

```bash
vibe server-run --command "npm run dev" --timeout 120000 --interval 2000
```

### Start a server with custom environment variables and keep it running afterward

```bash
vibe server-run --command "npm run dev" --env "NODE_ENV=production,DEBUG=true" --keep-alive
```

## Features

- Start any server with a configurable command
- Detect when a port becomes available
- Poll a URL until it responds successfully
- Execute commands against the running server
- Automatically tear down the server after command execution
- Configurable timeout for server readiness
- Customizable polling interval for readiness checks
- Detailed logging with different verbosity levels
- Support for environment variable passing
- Option to keep the server running after command completion

## Implementation

This command is designed to be used with any server that can be started via a command-line command. It provides a flexible way to:

1. Start a server process
2. Wait for it to be fully initialized (either by checking a port or polling a URL)
3. Run commands against the running server
4. Clean up the server process when done

This is particularly useful for CI/CD pipelines, automated testing, and local development workflows.