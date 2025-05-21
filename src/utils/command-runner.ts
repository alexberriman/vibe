import { exec } from "node:child_process";
import { Result, Ok, Err } from "ts-results";
import type { Logger } from "pino";

/**
 * Command execution result
 */
export type CommandResult = {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
};

/**
 * Options for running a command
 */
export type RunCommandOptions = {
  readonly command: string;
  readonly timeout?: number;
  readonly env?: Record<string, string>;
  readonly logger?: Logger;
};

/**
 * Run a command and return the result
 */
export async function runCommand({
  command,
  timeout = 60000,
  env = {},
  logger,
}: RunCommandOptions): Promise<Result<CommandResult, Error>> {
  return new Promise((resolve) => {
    logger?.debug(`Running command: ${command}`);
    logger?.debug(`Environment variables: ${JSON.stringify(env)}`);

    // Create a merged environment with process.env and custom env
    const mergedEnv = { ...process.env, ...env };

    exec(
      command,
      {
        timeout,
        env: mergedEnv,
      },
      (error, stdout, stderr) => {
        const exitCode = error ? error.code || 1 : 0;

        if (stdout.trim()) {
          logger?.debug(`Command stdout: ${stdout.trim()}`);
        }

        if (stderr.trim()) {
          logger?.debug(`Command stderr: ${stderr.trim()}`);
        }

        if (error) {
          // Timeout error
          if (error.signal === "SIGTERM" && error.killed) {
            logger?.error(`Command timed out after ${timeout}ms`);
            resolve(Err(new Error(`Command timed out after ${timeout}ms: ${command}`)));
            return;
          }

          logger?.error(`Command failed with exit code ${exitCode}: ${error.message}`);
          // Return the result even if the command failed - the caller can check the exitCode
          resolve(
            Ok({
              stdout,
              stderr,
              exitCode,
            })
          );
          return;
        }

        logger?.debug(`Command completed successfully with exit code ${exitCode}`);
        resolve(
          Ok({
            stdout,
            stderr,
            exitCode,
          })
        );
      }
    );
  });
}
