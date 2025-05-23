import { simpleGit } from "simple-git";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createLogger } from "../../utils/logger.js";
import { ProgressIndicator } from "../../utils/progress-indicator.js";
import { runCommand } from "../../utils/command-runner.js";
import { TempDirManager } from "./temp-dir-manager.js";

export interface CloneTemplateOptions {
  branch?: string;
  verbose?: boolean;
  onProgress?: (progress: number) => void;
}

export interface GitInitOptions {
  authorName?: string;
  authorEmail?: string;
  verbose?: boolean;
}

/**
 * Git operations for template management
 */
export class GitOperations {
  private logger = createLogger();
  private tempDirManager: TempDirManager;

  constructor() {
    this.tempDirManager = new TempDirManager();
  }

  /**
   * Clone a template repository
   */
  async cloneTemplate(
    repository: string,
    targetPath: string,
    options: CloneTemplateOptions = {}
  ): Promise<void> {
    this.logger = createLogger({ level: options.verbose ? "debug" : "info" });

    // Create a temporary directory for cloning
    const tempDir = await this.tempDirManager.createTempDir();

    try {
      this.logger.info(`Cloning template from ${repository}...`);

      // Set up progress tracking
      const progressIndicator = new ProgressIndicator({ total: 100, title: "Cloning" });
      let lastProgress = 0;

      // Create git instance with progress handler
      const git = simpleGit({
        progress({ method, stage: _stage, progress }) {
          if (method === "clone" && progress) {
            if (progress > lastProgress) {
              lastProgress = progress;
              progressIndicator.update(progress);
              if (options.onProgress) {
                options.onProgress(progress);
              }
            }
          }
        },
      });

      // Set up clone options array
      const cloneOptionsArray: string[] = [];
      if (options.branch) {
        cloneOptionsArray.push("--branch", options.branch);
      }

      // Clone the repository
      if (cloneOptionsArray.length > 0) {
        await git.clone(repository, tempDir, cloneOptionsArray);
      } else {
        await git.clone(repository, tempDir);
      }
      progressIndicator.complete();

      // Remove .git directory
      const gitDir = path.join(tempDir, ".git");
      await fs.rm(gitDir, { recursive: true, force: true });

      // Move files to target directory
      await this.moveFiles(tempDir, targetPath);
    } catch (error) {
      this.logger.error("Failed to clone template", error);
      throw new Error(
        `Failed to clone template: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Clean up temp directory
      await this.tempDirManager.cleanupDir(tempDir);
    }
  }

  /**
   * Initialize a new git repository
   */
  async initializeRepository(projectPath: string, options: GitInitOptions = {}): Promise<void> {
    this.logger = createLogger({ level: options.verbose ? "debug" : "info" });

    try {
      this.logger.info("Initializing git repository...");

      // Change to project directory
      const projectGit = simpleGit(projectPath);

      // Initialize repository
      await projectGit.init();

      // Configure git if author info provided
      if (options.authorName) {
        await projectGit.addConfig("user.name", options.authorName);
      }

      if (options.authorEmail) {
        await projectGit.addConfig("user.email", options.authorEmail);
      }

      // Stage all files
      await projectGit.add(".");

      // Create initial commit
      const commitMessage = "Initial commit\n\n🤖 Generated with Vibe Scaffold";

      // Use command runner to ensure --no-verify flag is used
      const result = await runCommand({
        command: `cd "${projectPath}" && git commit -m "${commitMessage}" --no-verify`,
        logger: this.logger,
      });

      if (result.err) {
        throw new Error(`Git commit failed: ${result.val.message}`);
      }

      const commandResult = result.val;
      if (commandResult.exitCode !== 0) {
        throw new Error(`Git commit failed: ${commandResult.stderr}`);
      }

      this.logger.info("Git repository initialized with initial commit");
    } catch (error) {
      this.logger.error("Failed to initialize git repository", error);
      throw new Error(
        `Failed to initialize git repository: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Move files from source to target directory
   */
  private async moveFiles(source: string, target: string): Promise<void> {
    // Ensure target directory exists
    await fs.mkdir(target, { recursive: true });

    // Get all entries in source directory
    const entries = await fs.readdir(source, { withFileTypes: true });

    // Move each entry
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        await this.moveFiles(sourcePath, targetPath);
      } else {
        // Ensure target directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * Check if a directory is a git repository
   */
  async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      const gitDir = path.join(dirPath, ".git");
      const stats = await fs.stat(gitDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get current git config value
   */
  async getGitConfig(key: string): Promise<string | null> {
    try {
      const git = simpleGit();
      const config = await git.getConfig(key);
      return config.value || null;
    } catch {
      return null;
    }
  }
}

// Export convenience functions
export const gitOperations = new GitOperations();

export async function cloneTemplate(
  repository: string,
  targetPath: string,
  options?: CloneTemplateOptions
): Promise<void> {
  return gitOperations.cloneTemplate(repository, targetPath, options);
}

export async function initializeRepository(
  projectPath: string,
  options?: GitInitOptions
): Promise<void> {
  return gitOperations.initializeRepository(projectPath, options);
}

export async function isGitRepository(dirPath: string): Promise<boolean> {
  return gitOperations.isGitRepository(dirPath);
}

export async function getGitConfig(key: string): Promise<string | null> {
  return gitOperations.getGitConfig(key);
}
