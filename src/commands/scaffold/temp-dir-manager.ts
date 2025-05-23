import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { rmSync } from "node:fs";
import { createLogger } from "../../utils/logger.js";

export interface TempDirOptions {
  prefix?: string;
  verbose?: boolean;
}

/**
 * Manages temporary directories for safe scaffolding operations
 */
// Global tracking of cleanup handlers to avoid multiple registrations
let globalCleanupHandlersRegistered = false;
const allTempDirManagers: Set<TempDirManager> = new Set();

export class TempDirManager {
  private logger = createLogger();
  private tempDirs: Set<string> = new Set();

  constructor(options: TempDirOptions = {}) {
    this.logger = createLogger({ level: options.verbose ? "debug" : "info" });
    allTempDirManagers.add(this);
    this.registerCleanupHandlers();
  }

  /**
   * Create a temporary directory
   */
  async createTempDir(prefix = "vibe-scaffold-"): Promise<string> {
    try {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
      this.tempDirs.add(tempDir);
      this.logger.debug(`Created temporary directory: ${tempDir}`);
      return tempDir;
    } catch (error) {
      this.logger.error("Failed to create temporary directory", error);
      throw new Error(`Failed to create temporary directory: ${error as Error}`);
    }
  }

  /**
   * Clean up a specific temporary directory
   */
  async cleanupDir(tempDir: string): Promise<void> {
    if (!this.tempDirs.has(tempDir)) {
      if (this.logger) {
        this.logger.debug(`Directory not managed by TempDirManager: ${tempDir}`);
      }
      return;
    }

    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      this.tempDirs.delete(tempDir);
      if (this.logger) {
        this.logger.debug(`Cleaned up temporary directory: ${tempDir}`);
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to clean up temporary directory: ${tempDir}`, error);
      }
      // Don't throw - best effort cleanup
    }
  }

  /**
   * Clean up all temporary directories
   */
  async cleanupAll(): Promise<void> {
    if (this.logger) {
      this.logger.debug(`Cleaning up ${this.tempDirs.size} temporary directories`);
    }

    const cleanupPromises = Array.from(this.tempDirs).map((dir) => this.cleanupDir(dir));

    await Promise.all(cleanupPromises);
  }

  /**
   * Register process exit handlers for cleanup
   */
  private registerCleanupHandlers(): void {
    if (globalCleanupHandlersRegistered) {
      return;
    }

    const cleanup = async (): Promise<void> => {
      // Clean up all managers
      const cleanupPromises = Array.from(allTempDirManagers).map((manager) => manager.cleanupAll());
      await Promise.all(cleanupPromises);
    };

    // Handle normal exit
    process.on("exit", () => {
      // Synchronous cleanup on exit for all managers
      for (const manager of allTempDirManagers) {
        for (const dir of manager.tempDirs) {
          try {
            // Use sync methods in exit handler
            rmSync(dir, { recursive: true, force: true });
            if (manager.logger) {
              manager.logger.debug(`Cleaned up on exit: ${dir}`);
            }
          } catch {
            // Ignore errors during exit cleanup
          }
        }
      }
    });

    // Handle termination signals
    const signals: readonly NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
    signals.forEach((signal) => {
      process.once(signal, async () => {
        await cleanup();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.once("uncaughtException", async (error) => {
      console.error("Uncaught exception", error);
      await cleanup();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.once("unhandledRejection", async (reason) => {
      console.error("Unhandled rejection", reason);
      await cleanup();
      process.exit(1);
    });

    globalCleanupHandlersRegistered = true;
  }

  /**
   * Get the number of managed temporary directories
   */
  get managedDirCount(): number {
    return this.tempDirs.size;
  }

  /**
   * Get list of managed directories (for testing)
   */
  getManagedDirs(): string[] {
    return Array.from(this.tempDirs);
  }
}
