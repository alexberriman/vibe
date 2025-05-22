import { Command } from "commander";
import { createLogger } from "../../utils/logger.js";
import { launchServer, parseEnvString, type ServerInstance } from "../../utils/server-launcher.js";
import {
  isPortAvailable,
  waitForPortToBecomeUnavailable,
  waitForUrl,
} from "../../utils/network-checker.js";
import { runCommand } from "../../utils/command-runner.js";
import { DEFAULT_ERROR_PATTERNS } from "../../utils/server-error-detector.js";
import type { Logger } from "pino";

type ServerRunOptions = {
  readonly command: string;
  readonly port?: number;
  readonly url?: string;
  readonly timeout?: number;
  readonly wait: boolean;
  readonly verbose: boolean;
  readonly keepAlive: boolean;
  readonly runCommand?: string;
  readonly env?: string;
  readonly interval?: number;
  readonly stallTimeout?: number;
};

/**
 * Check if port is available and exit if not
 */
async function checkPortAvailability(port: number, logger: Logger): Promise<void> {
  logger.info(`Checking if port ${port} is available...`);
  const portResult = await isPortAvailable({
    port,
    logger,
  });

  if (portResult.err) {
    logger.error(`Error checking port availability: ${portResult.val.message}`);
    process.exit(1);
  }

  if (!portResult.val) {
    logger.error(`Port ${port} is already in use. Aborting.`);
    process.exit(1);
  }

  logger.info(`Port ${port} is available.`);
}

/**
 * Wait for server to be ready using port
 */
async function waitForServerUsingPort(
  options: ServerRunOptions,
  logger: Logger,
  server: ServerInstance
): Promise<void> {
  logger.info(`Waiting for port ${options.port} to become unavailable...`);

  // Port should always be defined here due to the call context
  if (!options.port) {
    logger.error("Port is required for waiting");
    await server.kill();
    process.exit(1);
  }

  // First try URL-based checking if possible - this is more reliable
  const url = `http://localhost:${options.port}`;
  logger.debug(`Attempting URL-based readiness check at ${url}`);

  const waitUrlResult = await waitForUrl({
    url,
    timeout: options.timeout,
    interval: options.interval,
    logger,
  });

  if (waitUrlResult.err) {
    logger.debug(`URL check failed: ${waitUrlResult.val.message}, falling back to port check`);

    // Fall back to port checking
    const waitPortResult = await waitForPortToBecomeUnavailable({
      port: options.port,
      timeout: options.timeout,
      interval: options.interval,
      logger,
    });

    if (waitPortResult.err) {
      logger.error(`Error waiting for port: ${waitPortResult.val.message}`);
      await server.kill();
      process.exit(1);
    }

    if (!waitPortResult.val) {
      logger.error(`Timed out waiting for port ${options.port} to become unavailable.`);
      await server.kill();
      process.exit(1);
    }
  } else if (!waitUrlResult.val) {
    logger.error(`Timed out waiting for URL ${url} to become available.`);
    await server.kill();
    process.exit(1);
  }

  logger.info(`Server is ready at port ${options.port}.`);

  // Mark the server as successfully started
  if ("markStartupCompleted" in server) {
    (server as ServerInstance & { markStartupCompleted: () => void }).markStartupCompleted();
  }
}

/**
 * Wait for server to be ready using URL
 */
async function waitForServerUsingUrl(
  options: ServerRunOptions,
  logger: Logger,
  server: ServerInstance
): Promise<void> {
  logger.info(`Waiting for URL ${options.url} to become available...`);

  // URL should always be defined here due to the call context
  if (!options.url) {
    logger.error("URL is required for waiting");
    await server.kill();
    process.exit(1);
  }

  const waitUrlResult = await waitForUrl({
    url: options.url,
    timeout: options.timeout,
    interval: options.interval,
    logger,
  });

  if (waitUrlResult.err) {
    logger.error(`Error waiting for URL: ${waitUrlResult.val.message}`);
    await server.kill();
    process.exit(1);
  }

  if (waitUrlResult.val) {
    logger.info(`URL ${options.url} is now available.`);

    // Mark the server as successfully started
    if ("markStartupCompleted" in server) {
      (server as ServerInstance & { markStartupCompleted: () => void }).markStartupCompleted();
    }
  } else {
    logger.error(`Timed out waiting for URL ${options.url} to become available.`);
    await server.kill();
    process.exit(1);
  }
}

/**
 * Run command against server
 */
async function runCommandAgainstServer(
  options: ServerRunOptions,
  logger: Logger,
  server: ServerInstance,
  env: Record<string, string>
): Promise<void> {
  logger.info(`Running command: ${options.runCommand}`);

  // Command should always be defined here due to the call context
  if (!options.runCommand) {
    logger.error("Command is required for execution");
    if (!options.keepAlive) {
      await server.kill();
    }
    process.exit(1);
  }

  const commandResult = await runCommand({
    command: options.runCommand,
    timeout: options.timeout,
    env,
    logger,
  });

  if (commandResult.err) {
    logger.error(`Command execution failed: ${commandResult.val.message}`);
    if (!options.keepAlive) {
      await server.kill();
    }
    process.exit(1);
  }

  const result = commandResult.val;

  logger.info(`Command completed with exit code ${result.exitCode}`);

  if (result.stdout.trim()) {
    logger.info("Command stdout:");
    console.log(result.stdout);
  }

  if (result.stderr.trim()) {
    logger.info("Command stderr:");
    console.error(result.stderr);
  }

  if (result.exitCode !== 0) {
    logger.error(`Command failed with exit code ${result.exitCode}`);
    if (!options.keepAlive) {
      await server.kill();
    }
    process.exit(result.exitCode);
  }
}

/**
 * Create a server-run command
 */
export function serverRunCommand(): Command {
  const command = new Command("server-run");

  command
    .description(
      "Start a server, wait for it to be ready, run commands against it, then tear it down"
    )
    .option("-c, --command <command>", "Command to start the server (required)")
    .option("-p, --port <port>", "Port to check for availability", (value) => parseInt(value, 10))
    .option("-u, --url <url>", "URL to poll for readiness")
    .option(
      "-t, --timeout <timeout>",
      "Timeout in milliseconds before giving up",
      (value) => parseInt(value, 10),
      60000
    )
    .option(
      "-i, --interval <interval>",
      "Interval in milliseconds between readiness checks",
      (value) => parseInt(value, 10),
      1000
    )
    .option(
      "--stall-timeout <stallTimeout>",
      "Timeout in milliseconds before considering server stalled",
      (value) => parseInt(value, 10),
      30000
    )
    .option("-w, --wait", "Wait for server to be ready", true)
    .option("-v, --verbose", "Verbose output", false)
    .option("-k, --keep-alive", "Keep server running after command execution", false)
    .option("-r, --run-command <command>", "Command to run against the server once it's ready")
    .option(
      "-e, --env <env>",
      "Environment variables to pass to the server (format: KEY1=value1,KEY2=value2)"
    )
    .action(async (options: ServerRunOptions) => {
      // Create logger with appropriate verbosity
      const logger = createLogger({
        level: options.verbose ? "debug" : "info",
      });

      try {
        await runServerCommand(options, logger);
      } catch (error) {
        logger.error("Failed to run server command");
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  return command;
}

/**
 * Validates server options
 */
function validateOptions(options: ServerRunOptions, logger: Logger): void {
  // Check if command is provided
  if (!options.command) {
    logger.error("Error: --command option is required");
    process.exit(1);
  }

  logger.info(`Server command: ${options.command}`);

  if (options.port) {
    logger.info(`Port to check: ${options.port}`);
  }

  if (options.url) {
    logger.info(`URL to poll: ${options.url}`);
  }

  if (options.timeout) {
    logger.info(`Timeout: ${options.timeout}ms`);
  }

  if (options.stallTimeout) {
    logger.info(`Stall detection timeout: ${options.stallTimeout}ms`);
  }

  // Check if either port or URL is provided when wait is enabled
  if (options.wait && !options.port && !options.url) {
    logger.warn(
      "No port or URL specified for readiness check. The command will continue but won't wait for server readiness."
    );
  }
}

/**
 * Handle server startup error
 */
async function handleServerStartupError(
  error: Error,
  output: string,
  logger: Logger,
  server: ServerInstance
): Promise<never> {
  logger.error(`Server startup error: ${error.message}`);

  // Log detailed error output when verbose
  logger.debug("Server output:");
  logger.debug(output);

  // Kill the server process
  await server.kill();

  // Exit with error code
  process.exit(1);
}

/**
 * Handles server startup and setup
 */
async function startServer(
  options: ServerRunOptions,
  logger: Logger,
  env: Record<string, string>
): Promise<ServerInstance> {
  // Launch the server
  logger.info("Launching server...");
  const serverResult = launchServer({
    command: options.command,
    env,
    logger,
    errorPatterns: DEFAULT_ERROR_PATTERNS,
    stallTimeout: options.stallTimeout,
    onData: (data) => {
      // Log stdout if verbose is enabled
      if (options.verbose) {
        process.stdout.write(data);
      }
    },
    onError: (data) => {
      // Always log stderr
      process.stderr.write(data);
    },
    onExit: (code) => {
      if (code !== 0) {
        logger.error(`Server process exited with code ${code}`);
        process.exit(code || 1);
      }
    },
    onStartupError: async (error, output) => {
      await handleServerStartupError(error, output, logger, serverResult.unwrap());
    },
  });

  if (serverResult.err) {
    logger.error(`Failed to launch server: ${serverResult.val.message}`);
    process.exit(1);
  }

  const server = serverResult.val;
  logger.info("Server launched successfully");

  return server;
}

/**
 * Handles server readiness checks
 */
async function waitForServerReadiness(
  options: ServerRunOptions,
  logger: Logger,
  server: ServerInstance
): Promise<void> {
  if (!options.wait) {
    return;
  }

  // If port is specified, wait for it to become unavailable (indicating server is listening)
  if (options.port) {
    await waitForServerUsingPort(options, logger, server);
  }

  // If URL is specified, wait for it to become available
  if (options.url) {
    await waitForServerUsingUrl(options, logger, server);
  }
}

/**
 * Main function to run the server command
 */
async function runServerCommand(options: ServerRunOptions, logger: Logger): Promise<void> {
  logger.info("Starting server-run command");

  // Validate options
  validateOptions(options, logger);

  // Parse environment variables
  let env: Record<string, string> = {};
  if (options.env) {
    env = parseEnvString(options.env);
    logger.debug(`Environment variables: ${JSON.stringify(env)}`);
  }

  // Pre-check port availability when a port is specified
  if (options.port) {
    await checkPortAvailability(options.port, logger);
  }

  // Start the server
  const server = await startServer(options, logger, env);

  // Wait for server readiness
  await waitForServerReadiness(options, logger, server);

  // Run command if specified
  if (options.runCommand) {
    await runCommandAgainstServer(options, logger, server, env);
  }

  // Keep server running or tear it down
  if (options.keepAlive) {
    logger.info("Keeping server running. Press Ctrl+C to stop.");
  } else {
    logger.info("Shutting down server...");
    await server.kill();
    logger.info("Server shut down successfully");
    process.exit(0);
  }
}
