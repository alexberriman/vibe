import * as path from "node:path";
import { createLogger } from "../../utils/logger.js";
import { runCommand } from "../../utils/command-runner.js";
import { ProgressIndicator } from "../../utils/progress-indicator.js";
import type { PostProcessingStep } from "./template-registry.js";

export interface PostProcessOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Post-processor for running template post-processing steps
 */
export class PostProcessor {
  private logger = createLogger();

  /**
   * Run post-processing steps
   */
  async runPostProcessing(
    projectPath: string,
    steps: PostProcessingStep[],
    options: PostProcessOptions = {}
  ): Promise<void> {
    this.logger = createLogger({ level: options.verbose ? "debug" : "info" });

    if (!steps || steps.length === 0) {
      this.logger.debug("No post-processing steps defined");
      return;
    }

    this.logger.info("Running post-processing steps...");

    for (const step of steps) {
      await this.runStep(projectPath, step, options);
    }
  }

  /**
   * Run a single post-processing step
   */
  private async runStep(
    projectPath: string,
    step: PostProcessingStep,
    options: PostProcessOptions
  ): Promise<void> {
    const description = step.description || step.name;

    if (options.dryRun) {
      this.logger.info(`Would run: ${description}`);
      return;
    }

    this.logger.info(`Running: ${description}`);

    try {
      if (step.command) {
        await this.runCommand(projectPath, step.command, step.name);
      } else if (step.script) {
        await this.runScript(projectPath, step.script, step.name);
      }
    } catch (error) {
      this.logger.error(`Failed to run post-processing step: ${step.name}`, error);
      throw error;
    }
  }

  /**
   * Run a command
   */
  private async runCommand(projectPath: string, command: string, _name: string): Promise<void> {
    // Parse command into parts
    const parts = command.split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);

    // Special handling for npm install
    if (cmd === "npm" && args[0] === "install") {
      await this.runNpmInstall(projectPath);
      return;
    }

    // Run other commands
    const result = await runCommand({
      command: `cd "${projectPath}" && ${command}`,
      logger: this.logger,
    });

    if (result.err) {
      throw new Error(`Command failed: ${command}\n${result.val.message}`);
    }

    const commandResult = result.val;
    if (commandResult.exitCode !== 0) {
      throw new Error(`Command failed: ${command}\n${commandResult.stderr}`);
    }
  }

  /**
   * Run npm install with progress
   */
  private async runNpmInstall(projectPath: string): Promise<void> {
    const progressIndicator = new ProgressIndicator({
      total: 100,
      title: "Installing dependencies",
      showPercentage: false,
      showCount: false,
    });

    try {
      const result = await runCommand({
        command: `cd "${projectPath}" && npm install`,
        logger: this.logger,
      });

      if (result.err) {
        this.logger.error("Failed to install dependencies");
        throw new Error(`npm install failed: ${result.val.message}`);
      }

      const commandResult = result.val;
      if (commandResult.exitCode !== 0) {
        this.logger.error("Failed to install dependencies");
        throw new Error(`npm install failed: ${commandResult.stderr}`);
      }

      progressIndicator.complete();
    } catch (error) {
      this.logger.error("Failed to install dependencies");
      throw error;
    }
  }

  /**
   * Run a script file
   */
  private async runScript(projectPath: string, script: string, _name: string): Promise<void> {
    const scriptPath = path.join(projectPath, script);

    const result = await runCommand({
      command: `cd "${projectPath}" && node "${scriptPath}"`,
      logger: this.logger,
    });

    if (result.err) {
      throw new Error(`Script failed: ${script}\n${result.val.message}`);
    }

    const commandResult = result.val;
    if (commandResult.exitCode !== 0) {
      throw new Error(`Script failed: ${script}\n${commandResult.stderr}`);
    }
  }

  /**
   * Get default post-processing steps based on project structure
   */
  async getDefaultSteps(projectPath: string): Promise<PostProcessingStep[]> {
    const steps: PostProcessingStep[] = [];

    // Only add npm install if package.json exists
    try {
      await import("node:fs/promises").then((fs) =>
        fs.access(path.join(projectPath, "package.json"))
      );
      steps.push({
        name: "install-dependencies",
        command: "npm install",
        description: "Installing project dependencies",
      });
    } catch {
      // No package.json found, skip npm install
    }

    return steps;
  }
}

// Export convenience functions
export const postProcessor = new PostProcessor();

export async function runPostProcessing(
  projectPath: string,
  steps: PostProcessingStep[],
  options?: PostProcessOptions
): Promise<void> {
  return postProcessor.runPostProcessing(projectPath, steps, options);
}

export async function getDefaultPostProcessingSteps(
  projectPath: string
): Promise<PostProcessingStep[]> {
  return postProcessor.getDefaultSteps(projectPath);
}
