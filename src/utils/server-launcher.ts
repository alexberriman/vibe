import { spawn, type ChildProcess } from "node:child_process";
import { Result, Ok, Err } from "ts-results";
import type { Logger } from "pino";
import type { Buffer } from "node:buffer";
import { analyzeServerStartupState, type ErrorPattern } from "./server-error-detector.js";
import { setInterval, clearInterval } from "node:timers";

// Define Signals type for Node.js process signals
type Signals =
  | "SIGABRT"
  | "SIGALRM"
  | "SIGBUS"
  | "SIGCHLD"
  | "SIGCONT"
  | "SIGFPE"
  | "SIGHUP"
  | "SIGILL"
  | "SIGINT"
  | "SIGIO"
  | "SIGIOT"
  | "SIGKILL"
  | "SIGPIPE"
  | "SIGPOLL"
  | "SIGPROF"
  | "SIGPWR"
  | "SIGQUIT"
  | "SIGSEGV"
  | "SIGSTKFLT"
  | "SIGSTOP"
  | "SIGSYS"
  | "SIGTERM"
  | "SIGTRAP"
  | "SIGTSTP"
  | "SIGTTIN"
  | "SIGTTOU"
  | "SIGUNUSED"
  | "SIGURG"
  | "SIGUSR1"
  | "SIGUSR2"
  | "SIGVTALRM"
  | "SIGWINCH"
  | "SIGXCPU"
  | "SIGXFSZ"
  | "SIGBREAK"
  | "SIGLOST"
  | "SIGINFO";

/**
 * Options for launching a server
 */
export type ServerLaunchOptions = {
  readonly command: string;
  readonly args?: readonly string[];
  readonly env?: Record<string, string>;
  readonly logger?: Logger;
  readonly onData?: (_data: Buffer) => void;
  readonly onError?: (_data: Buffer) => void;
  readonly onExit?: (_code: number | null, _signal: Signals | null) => void;
  readonly errorPatterns?: readonly ErrorPattern[];
  readonly stallTimeout?: number;
  readonly onStartupError?: (_error: Error, _output: string) => void;
};

/**
 * Server instance
 */
export type ServerInstance = {
  readonly process: ChildProcess;
  readonly kill: () => Promise<Result<void, Error>>;
};

/**
 * Parse the environment string (format: KEY1=value1,KEY2=value2)
 */
export function parseEnvString(envString: string): Record<string, string> {
  if (!envString) {
    return {};
  }

  return envString.split(",").reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});
}

/**
 * Launch a server process
 */
export function launchServer({
  command,
  args = [],
  env = {},
  logger,
  onData,
  onError,
  onExit,
  errorPatterns,
  stallTimeout = 30000,
  onStartupError,
}: ServerLaunchOptions): Result<ServerInstance, Error> {
  try {
    // Parse the command string to extract the main command and args
    const commandParts = command.trim().split(/\s+/);
    const mainCommand = commandParts[0];
    const commandArgs = [...commandParts.slice(1), ...args];

    logger?.debug(`Launching server: ${mainCommand} ${commandArgs.join(" ")}`);
    logger?.debug(`Environment variables: ${JSON.stringify(env)}`);

    // Create a merged environment with process.env and custom env
    const mergedEnv = { ...process.env, ...env };

    // Variables for tracking output and startup state
    let stdoutOutput = "";
    let stderrOutput = "";
    let previousOutput = "";
    const startTime = Date.now();
    let isStartupCompleted = false;
    let serverStartupCheckInterval: ReturnType<typeof setInterval> | null = null;

    // Launch the process
    const serverProcess = spawn(mainCommand, commandArgs, {
      env: mergedEnv,
      shell: true,
      stdio: "pipe",
    });

    // Setup data handlers
    if (serverProcess.stdout) {
      serverProcess.stdout.on("data", (data: Buffer) => {
        if (onData) {
          onData(data);
        }

        const output = data.toString();
        stdoutOutput += output;

        if (output.trim()) {
          logger?.debug(`Server stdout: ${output.trim()}`);
        }
      });
    }

    if (serverProcess.stderr) {
      serverProcess.stderr.on("data", (data: Buffer) => {
        if (onError) {
          onError(data);
        }

        const output = data.toString();
        stderrOutput += output;

        if (output.trim()) {
          logger?.debug(`Server stderr: ${output.trim()}`);
        }
      });
    }

    // Setup exit handler
    serverProcess.on("exit", (code, signal) => {
      // Clear the startup check interval if it's running
      if (serverStartupCheckInterval) {
        clearInterval(serverStartupCheckInterval);
        serverStartupCheckInterval = null;
      }

      // Only treat as an error if startup wasn't completed and exit code is non-zero
      if (!isStartupCompleted && code !== 0 && onStartupError) {
        const combinedOutput = `${stdoutOutput}\n${stderrOutput}`;
        onStartupError(
          new Error(`Server process exited with code ${code} during startup`),
          combinedOutput
        );
      }

      if (onExit) {
        onExit(code, signal);
      }
      logger?.debug(`Server process exited with code ${code} and signal ${signal}`);
    });

    // Setup error handler for process spawn errors
    serverProcess.on("error", (error) => {
      logger?.error(`Server process spawn error: ${error.message}`);
      if (onStartupError) {
        onStartupError(error, `${stdoutOutput}\n${stderrOutput}`);
      }
    });

    // Setup periodic checking for startup state
    if (onStartupError) {
      serverStartupCheckInterval = setInterval(() => {
        // Skip if startup is already completed
        if (isStartupCompleted) {
          return;
        }

        const combinedOutput = `${stdoutOutput}\n${stderrOutput}`;
        const elapsedTime = Date.now() - startTime;

        const stateResult = analyzeServerStartupState({
          output: combinedOutput,
          previousOutput,
          elapsedTime,
          stallTimeout,
          errorPatterns,
          logger,
        });

        // Store current output as previous for the next check
        previousOutput = combinedOutput;

        if (stateResult.err) {
          logger?.error(`Error analyzing server startup state: ${stateResult.val.message}`);
          return;
        }

        const state = stateResult.val;

        // Handle different startup states
        switch (state.state) {
          case "error":
            // Clear the interval, we've detected an error
            if (serverStartupCheckInterval) {
              clearInterval(serverStartupCheckInterval);
              serverStartupCheckInterval = null;
            }

            logger?.error(`Server startup error detected: ${state.errorMessage}`);
            if (onStartupError) {
              onStartupError(
                new Error(`Server startup error: ${state.errorMessage}`),
                combinedOutput
              );
            }
            break;

          case "stalled":
            // Clear the interval, we've detected a stall
            if (serverStartupCheckInterval) {
              clearInterval(serverStartupCheckInterval);
              serverStartupCheckInterval = null;
            }

            logger?.error(`Server startup stalled: ${state.errorMessage}`);
            if (onStartupError) {
              onStartupError(
                new Error(`Server startup stalled: ${state.errorMessage}`),
                combinedOutput
              );
            }
            break;

          case "starting":
            // Still starting, continue monitoring
            logger?.debug("Server is still starting up");
            break;
        }
      }, 1000); // Check every second
    }

    // Create a kill function that properly tears down the process
    const kill = async (): Promise<Result<void, Error>> => {
      // Clear the startup check interval if it's running
      if (serverStartupCheckInterval) {
        clearInterval(serverStartupCheckInterval);
        serverStartupCheckInterval = null;
      }

      // Mark startup as completed to prevent treating exit as startup error
      isStartupCompleted = true;

      return new Promise((resolve) => {
        if (!serverProcess || serverProcess.killed) {
          logger?.debug("Server process is already killed");
          resolve(Ok(undefined));
          return;
        }

        logger?.debug("Killing server process");

        // Setup one-time exit listener to resolve the promise
        serverProcess.once("exit", () => {
          logger?.debug("Server process killed successfully");
          resolve(Ok(undefined));
        });

        try {
          // Kill the process
          const killed = serverProcess.kill();

          if (!killed) {
            logger?.error("Failed to kill server process");
            resolve(Err(new Error("Failed to kill server process")));
          }

          // Set a timeout to force kill if the process doesn't exit
          setTimeout(() => {
            try {
              if (!serverProcess.killed) {
                logger?.debug("Server process did not exit, force killing");
                // Force kill with SIGKILL
                const forceKilled = serverProcess.kill("SIGKILL");

                if (!forceKilled) {
                  logger?.error("Failed to force kill server process");
                  resolve(Err(new Error("Failed to force kill server process")));
                }
              }
            } catch (error) {
              logger?.error(`Error force killing server process: ${String(error)}`);
              resolve(Err(new Error(`Error force killing server process: ${String(error)}`)));
            }
          }, 5000);
        } catch (error) {
          logger?.error(`Error killing server process: ${String(error)}`);
          resolve(Err(new Error(`Error killing server process: ${String(error)}`)));
        }
      });
    };

    // Method to mark startup as completed (to be called when server is ready)
    const markStartupCompleted = (): void => {
      isStartupCompleted = true;

      // Clear the startup check interval if it's running
      if (serverStartupCheckInterval) {
        clearInterval(serverStartupCheckInterval);
        serverStartupCheckInterval = null;
      }
    };

    // Handle SIGINT and SIGTERM to kill the server process
    const handleSignal = (signal: Signals): void => {
      logger?.debug(`Received ${signal}, killing server process`);
      kill()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          logger?.error(`Error killing server process: ${error}`);
          process.exit(1);
        });
    };

    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));

    logger?.info("Server process launched successfully");

    return Ok({
      process: serverProcess,
      kill,
      // Add markStartupCompleted to the server instance
      markStartupCompleted,
    } as ServerInstance & { markStartupCompleted: () => void });
  } catch (error) {
    logger?.error(`Error launching server: ${String(error)}`);
    return Err(new Error(`Error launching server: ${String(error)}`));
  }
}
