import tsResults, { type Result } from "ts-results";
const { Ok, Err } = tsResults;
import type { Logger } from "pino";

/**
 * Common error patterns that indicate server startup failures
 */
export type ErrorPattern = {
  readonly pattern: RegExp;
  readonly message: string;
};

/**
 * Default error patterns to detect server startup failures
 */
export const DEFAULT_ERROR_PATTERNS: readonly ErrorPattern[] = [
  {
    pattern: /EADDRINUSE/i,
    message: "Address already in use - port is already occupied",
  },
  {
    pattern: /EACCES/i,
    message: "Permission denied - insufficient privileges",
  },
  {
    pattern: /error:\s*cannot\s+bind/i,
    message: "Binding error - cannot bind to the specified address or port",
  },
  {
    pattern: /command not found/i,
    message: "Command not found - check if the specified command exists",
  },
  {
    pattern: /npm ERR!/i,
    message: "NPM error - check npm package or script",
  },
  {
    pattern: /error: unknown option|error: unrecognized option/i,
    message: "Unknown command option - check command syntax",
  },
  {
    pattern: /syntax error|syntaxerror/i,
    message: "Syntax error in script or configuration",
  },
  {
    pattern: /failed to start|failed to launch|cannot start/i,
    message: "Server failed to start",
  },
  {
    pattern: /error: module not found|cannot find module/i,
    message: "Module not found - missing dependency",
  },
  {
    pattern: /fatal error|fatal exception/i,
    message: "Fatal error occurred during startup",
  },
  {
    pattern: /timeout exceeded/i,
    message: "Timeout exceeded while starting the server",
  },
];

/**
 * Options for server error analysis
 */
export type ServerErrorAnalysisOptions = {
  readonly output: string;
  readonly errorPatterns?: readonly ErrorPattern[];
  readonly logger?: Logger;
};

/**
 * Error detection result
 */
export type ErrorDetectionResult = {
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly matchedPattern?: string;
};

/**
 * Analyzes server output to detect error patterns
 */
export function detectServerStartupErrors({
  output,
  errorPatterns = DEFAULT_ERROR_PATTERNS,
  logger,
}: ServerErrorAnalysisOptions): Result<ErrorDetectionResult, Error> {
  try {
    logger?.debug("Analyzing server output for error patterns");

    for (const pattern of errorPatterns) {
      if (pattern.pattern.test(output)) {
        logger?.debug(`Found error pattern: ${pattern.pattern} - ${pattern.message}`);

        return Ok({
          isError: true,
          errorMessage: pattern.message,
          matchedPattern: pattern.pattern.toString(),
        });
      }
    }

    logger?.debug("No error patterns detected in server output");

    return Ok({
      isError: false,
    });
  } catch (error) {
    logger?.error(`Error analyzing server output: ${String(error)}`);
    return Err(new Error(`Error analyzing server output: ${String(error)}`));
  }
}

/**
 * Options for progress detection
 */
export type ServerProgressDetectionOptions = {
  readonly previousOutput: string;
  readonly currentOutput: string;
  readonly outputWindow?: number;
  readonly logger?: Logger;
};

/**
 * Checks if server is making progress by comparing outputs
 */
export function isServerMakingProgress({
  previousOutput,
  currentOutput,
  outputWindow = 1000,
  logger,
}: ServerProgressDetectionOptions): Result<boolean, Error> {
  try {
    // If there was no previous output, then it's making progress
    if (!previousOutput) {
      return Ok(true);
    }

    // Get the last N characters of each output for comparison
    const prevLastChunk = previousOutput.slice(-outputWindow);
    const currentLastChunk = currentOutput.slice(-outputWindow);

    // If the output has changed, it's making progress
    const isProgressing = prevLastChunk !== currentLastChunk;

    logger?.debug(`Server progress check: ${isProgressing ? "making progress" : "stalled"}`);

    return Ok(isProgressing);
  } catch (error) {
    logger?.error(`Error detecting server progress: ${String(error)}`);
    return Err(new Error(`Error detecting server progress: ${String(error)}`));
  }
}

/**
 * Options for checking server startup state
 */
export type ServerStartupStateOptions = {
  readonly output: string;
  readonly previousOutput?: string;
  readonly elapsedTime: number;
  readonly stallTimeout?: number;
  readonly errorPatterns?: readonly ErrorPattern[];
  readonly logger?: Logger;
};

/**
 * Server startup state
 */
export type ServerStartupState = {
  readonly state: "starting" | "error" | "stalled";
  readonly errorMessage?: string;
  readonly matchedPattern?: string;
};

/**
 * Analyzes server startup state
 */
export function analyzeServerStartupState({
  output,
  previousOutput = "",
  elapsedTime,
  stallTimeout = 30000, // Default 30 seconds
  errorPatterns = DEFAULT_ERROR_PATTERNS,
  logger,
}: ServerStartupStateOptions): Result<ServerStartupState, Error> {
  try {
    // First, check for error patterns
    const errorResult = detectServerStartupErrors({
      output,
      errorPatterns,
      logger,
    });

    if (errorResult.err) {
      return Err(errorResult.val);
    }

    if (errorResult.val.isError) {
      return Ok({
        state: "error",
        errorMessage: errorResult.val.errorMessage,
        matchedPattern: errorResult.val.matchedPattern,
      });
    }

    // Next, check if the server is making progress
    const progressResult = isServerMakingProgress({
      previousOutput,
      currentOutput: output,
      logger,
    });

    if (progressResult.err) {
      return Err(progressResult.val);
    }

    // If it's not making progress and elapsed time exceeds stall timeout, it's stalled
    if (!progressResult.val && elapsedTime > stallTimeout) {
      return Ok({
        state: "stalled",
        errorMessage: `Server has stalled - no output changes in ${stallTimeout}ms`,
      });
    }

    // Otherwise, it's still starting
    return Ok({
      state: "starting",
    });
  } catch (error) {
    logger?.error(`Error analyzing server startup state: ${String(error)}`);
    return Err(new Error(`Error analyzing server startup state: ${String(error)}`));
  }
}
