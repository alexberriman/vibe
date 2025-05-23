import * as fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import type { Logger } from "pino";
import { TempDirManager } from "./temp-dir-manager.js";

export interface ErrorContext {
  stage: string;
  template?: string;
  outputDirectory?: string;
  tempDirectories?: string[];
  partiallyCreated?: boolean;
}

export interface CleanupOptions {
  removeTempDirs?: boolean;
  removeOutputDir?: boolean;
  removeGitRepo?: boolean;
  verbose?: boolean;
}

/**
 * Enhanced error types for better error categorization
 */
export enum ScaffoldErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  TEMPLATE_ERROR = "TEMPLATE_ERROR",
  GIT_ERROR = "GIT_ERROR",
  FILE_SYSTEM_ERROR = "FILE_SYSTEM_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  POST_PROCESSING_ERROR = "POST_PROCESSING_ERROR",
  USER_CANCELLATION = "USER_CANCELLATION",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class ScaffoldError extends Error {
  constructor(
    public type: ScaffoldErrorType,
    message: string,
    public context: ErrorContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = "ScaffoldError";
  }
}

/**
 * Comprehensive error handler for scaffold operations
 */
// Global cleanup registration flag
let globalCleanupRegistered = false;

export class ErrorHandler {
  private logger: Logger;
  private tempDirManager: TempDirManager;

  constructor(verbose = false) {
    this.logger = createLogger({ level: verbose ? "debug" : "info" });
    this.tempDirManager = new TempDirManager({ verbose });
    this.registerGlobalCleanupHandlers();
  }

  /**
   * Handle scaffold errors with appropriate cleanup and user guidance
   */
  async handleError(error: Error | ScaffoldError, context: ErrorContext): Promise<void> {
    let scaffoldError: ScaffoldError;

    if (error instanceof ScaffoldError) {
      scaffoldError = error;
    } else {
      // Categorize unknown errors
      scaffoldError = this.categorizeError(error, context);
    }

    // Log the error with context
    this.logger.error(`Failed at stage: ${context.stage}`);
    this.logger.error(`Error type: ${scaffoldError.type}`);
    this.logger.error(`Message: ${scaffoldError.message}`);

    if (scaffoldError.originalError && this.logger.level === "debug") {
      this.logger.debug("Original error:", scaffoldError.originalError);
    }

    // Perform cleanup
    await this.performCleanup(scaffoldError.context);

    // Provide recovery guidance
    this.displayRecoveryGuidance(scaffoldError);

    // Exit with appropriate code
    process.exit(1);
  }

  /**
   * Handle user cancellation (CTRL+C)
   */
  async handleCancellation(context: ErrorContext): Promise<void> {
    this.logger.info("");
    this.logger.info("⚠️ Scaffolding cancelled by user");

    const scaffoldError = new ScaffoldError(
      ScaffoldErrorType.USER_CANCELLATION,
      "User cancelled the scaffolding process",
      context
    );

    await this.performCleanup(context);
    this.displayRecoveryGuidance(scaffoldError);
    process.exit(0);
  }

  /**
   * Categorize unknown errors based on content and context
   */
  public categorizeError(error: Error, context: ErrorContext): ScaffoldError {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("dns") ||
      message.includes("host")
    ) {
      return new ScaffoldError(
        ScaffoldErrorType.NETWORK_ERROR,
        `Network error during ${context.stage}: ${error.message}`,
        context,
        error
      );
    }

    // Permission errors
    if (
      message.includes("permission") ||
      message.includes("access") ||
      message.includes("eacces") ||
      message.includes("eperm")
    ) {
      return new ScaffoldError(
        ScaffoldErrorType.PERMISSION_ERROR,
        `Permission error during ${context.stage}: ${error.message}`,
        context,
        error
      );
    }

    // Git-related errors
    if (
      message.includes("git") ||
      message.includes("repository") ||
      message.includes("clone") ||
      message.includes("commit")
    ) {
      return new ScaffoldError(
        ScaffoldErrorType.GIT_ERROR,
        `Git error during ${context.stage}: ${error.message}`,
        context,
        error
      );
    }

    // File system errors
    if (
      message.includes("file") ||
      message.includes("directory") ||
      message.includes("enoent") ||
      message.includes("eisdir") ||
      message.includes("eexist")
    ) {
      return new ScaffoldError(
        ScaffoldErrorType.FILE_SYSTEM_ERROR,
        `File system error during ${context.stage}: ${error.message}`,
        context,
        error
      );
    }

    // Post-processing errors (check first as it's more specific than "processing")
    if (
      context.stage.includes("post-processing") ||
      context.stage.includes("npm") ||
      context.stage.includes("install")
    ) {
      return new ScaffoldError(
        ScaffoldErrorType.POST_PROCESSING_ERROR,
        `Post-processing error during ${context.stage}: ${error.message}`,
        context,
        error
      );
    }

    // Template-related errors
    if (context.stage.includes("template") || context.stage.includes("processing")) {
      return new ScaffoldError(
        ScaffoldErrorType.TEMPLATE_ERROR,
        `Template error during ${context.stage}: ${error.message}`,
        context,
        error
      );
    }

    // Default to unknown error
    return new ScaffoldError(
      ScaffoldErrorType.UNKNOWN_ERROR,
      `Unexpected error during ${context.stage}: ${error.message}`,
      context,
      error
    );
  }

  /**
   * Perform comprehensive cleanup based on error context
   */
  private async performCleanup(context: ErrorContext): Promise<void> {
    this.logger.info("🧹 Cleaning up...");

    // Clean up temporary directories
    await this.tempDirManager.cleanupAll();

    // Clean up partially created output directory if it was created by us
    if (context.outputDirectory && context.partiallyCreated) {
      try {
        const stats = await fs.stat(context.outputDirectory);
        if (stats.isDirectory()) {
          this.logger.info(`Removing partially created directory: ${context.outputDirectory}`);
          await fs.rm(context.outputDirectory, { recursive: true, force: true });
        }
      } catch {
        // Directory might not exist or already cleaned up
        this.logger.debug("Output directory not found or already cleaned up");
      }
    }

    this.logger.info("✅ Cleanup completed");
  }

  /**
   * Display recovery guidance based on error type
   */
  public displayRecoveryGuidance(error: ScaffoldError): void {
    this.logger.info("");
    this.logger.info("💡 Recovery suggestions:");

    switch (error.type) {
      case ScaffoldErrorType.NETWORK_ERROR:
        this.logger.info("• Check your internet connection");
        this.logger.info("• Verify the template repository URL is correct");
        this.logger.info("• Try again in a few minutes");
        this.logger.info("• Check if you need VPN or proxy settings");
        if (error.context.template) {
          this.logger.info(`• Template: ${error.context.template}`);
        }
        break;

      case ScaffoldErrorType.PERMISSION_ERROR:
        this.logger.info("• Check directory permissions");
        this.logger.info("• Try running with appropriate permissions");
        this.logger.info("• Ensure you have write access to the target directory");
        if (error.context.outputDirectory) {
          this.logger.info(`• Target directory: ${error.context.outputDirectory}`);
        }
        break;

      case ScaffoldErrorType.TEMPLATE_ERROR:
        this.logger.info("• Verify the template is compatible with this CLI version");
        this.logger.info("• Check if the template repository exists and is accessible");
        this.logger.info("• Try a different template");
        this.logger.info("• Check template configuration (scaffold.config.json)");
        break;

      case ScaffoldErrorType.GIT_ERROR:
        this.logger.info("• Ensure git is installed and configured");
        this.logger.info("• Check git credentials if accessing private repositories");
        this.logger.info("• Verify git user.name and user.email are set:");
        this.logger.info('  git config --global user.name "Your Name"');
        this.logger.info('  git config --global user.email "your.email@example.com"');
        break;

      case ScaffoldErrorType.FILE_SYSTEM_ERROR:
        this.logger.info("• Check available disk space");
        this.logger.info("• Verify file and directory permissions");
        this.logger.info("• Ensure the target directory is not in use by another process");
        break;

      case ScaffoldErrorType.POST_PROCESSING_ERROR:
        this.logger.info("• Check if Node.js and npm are properly installed");
        this.logger.info("• Try running 'npm install' manually in the project directory");
        this.logger.info("• Check package.json for any issues");
        this.logger.info("• Verify internet connection for package downloads");
        break;

      case ScaffoldErrorType.VALIDATION_ERROR:
        this.logger.info("• Check the provided parameters and try again");
        this.logger.info("• Ensure all required fields are provided");
        this.logger.info("• Use --help for usage information");
        break;

      case ScaffoldErrorType.USER_CANCELLATION:
        this.logger.info("• Run the scaffold command again when ready");
        this.logger.info("• Use --help to see all available options");
        if (error.context.outputDirectory) {
          this.logger.info(`• Previous output directory has been cleaned up`);
        }
        break;

      default:
        this.logger.info("• Try running the command again");
        this.logger.info("• Use --verbose flag for more detailed error information");
        this.logger.info("• Check the CLI documentation for troubleshooting");
        this.logger.info("• Report this issue if the problem persists");
        break;
    }

    this.logger.info("");
    this.logger.info("📚 For more help, run: vibe scaffold --help");
  }

  /**
   * Register global cleanup handlers for process termination
   */
  private registerGlobalCleanupHandlers(): void {
    if (globalCleanupRegistered) {
      return;
    }

    // Handle CTRL+C and other termination signals
    const signals: readonly NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
    signals.forEach((signal) => {
      process.once(signal, async () => {
        await this.tempDirManager.cleanupAll();
        process.exit(0);
      });
    });

    globalCleanupRegistered = true;
  }

  /**
   * Create error context for tracking scaffold state
   */
  static createContext(
    stage: string,
    options: {
      template?: string;
      outputDirectory?: string;
      partiallyCreated?: boolean;
    } = {}
  ): ErrorContext {
    return {
      stage,
      template: options.template,
      outputDirectory: options.outputDirectory,
      partiallyCreated: options.partiallyCreated || false,
    };
  }

  /**
   * Wrap async operations with error handling
   */
  async wrapOperation<T>(operation: () => Promise<T>, context: ErrorContext): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error as Error, context);
      throw error; // This will never execute due to process.exit in handleError
    }
  }
}
