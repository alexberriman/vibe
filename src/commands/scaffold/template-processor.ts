import * as fs from "node:fs/promises";
import * as path from "node:path";
import { globby } from "globby";
import { createLogger } from "../../utils/logger.js";
import type { ScaffoldPromptAnswers } from "./prompts.js";
import type { TemplateConfig } from "./template-registry.js";

export interface ProcessingOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

export interface PlaceholderContext extends ScaffoldPromptAnswers {
  year: string;
  date: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Template processor for replacing placeholders and processing files
 */
export class TemplateProcessor {
  private logger = createLogger();

  /**
   * Process a template directory
   */
  async processTemplate(
    sourcePath: string,
    targetPath: string,
    answers: ScaffoldPromptAnswers,
    config: TemplateConfig,
    options: ProcessingOptions = {}
  ): Promise<void> {
    this.logger = createLogger({ level: options.verbose ? "debug" : "info" });

    // Create placeholder context
    const context = this.createPlaceholderContext(answers, config);

    // Get all files in the template
    const files = await this.getTemplateFiles(sourcePath);

    // Process each file
    for (const file of files) {
      await this.processFile(sourcePath, targetPath, file, context, options);
    }

    // Process special files
    await this.processSpecialFiles(targetPath, context, options);
  }

  /**
   * Create placeholder context from answers and config
   */
  private createPlaceholderContext(
    answers: ScaffoldPromptAnswers,
    config: TemplateConfig
  ): PlaceholderContext {
    const now = new Date();

    const context: PlaceholderContext = {
      ...answers,
      year: now.getFullYear().toString(),
      date: now.toISOString().split("T")[0],
    };

    // Add custom placeholders from config
    if (config.placeholders) {
      Object.assign(context, config.placeholders);
    }

    return context;
  }

  /**
   * Get all files in template directory
   */
  private async getTemplateFiles(templatePath: string): Promise<string[]> {
    const patterns = [
      "**/*",
      "!.git/**",
      "!node_modules/**",
      "!dist/**",
      "!build/**",
      "!coverage/**",
      "!scaffold.config.json",
    ];

    const files = await globby(patterns, {
      cwd: templatePath,
      dot: true,
      onlyFiles: true,
    });

    return files;
  }

  /**
   * Process a single file
   */
  private async processFile(
    sourcePath: string,
    targetPath: string,
    relativePath: string,
    context: PlaceholderContext,
    options: ProcessingOptions
  ): Promise<void> {
    const sourceFile = path.join(sourcePath, relativePath);
    const targetFile = path.join(targetPath, this.processFilename(relativePath, context));

    if (options.dryRun) {
      this.logger.debug(
        `Would process: ${relativePath} -> ${path.relative(targetPath, targetFile)}`
      );
      return;
    }

    // Ensure target directory exists
    const targetDir = path.dirname(targetFile);
    await fs.mkdir(targetDir, { recursive: true });

    // Check if file is binary
    if (await this.isBinaryFile(sourceFile)) {
      // Copy binary files as-is
      await fs.copyFile(sourceFile, targetFile);
      this.logger.debug(`Copied binary file: ${relativePath}`);
    } else {
      // Process text files
      const content = await fs.readFile(sourceFile, "utf-8");
      const processedContent = this.replacePlaceholders(content, context);
      await fs.writeFile(targetFile, processedContent, "utf-8");
      this.logger.debug(`Processed file: ${relativePath}`);
    }
  }

  /**
   * Process special files like package.json
   */
  private async processSpecialFiles(
    targetPath: string,
    context: PlaceholderContext,
    options: ProcessingOptions
  ): Promise<void> {
    // Process package.json
    const packageJsonPath = path.join(targetPath, "package.json");

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

      // Update package.json fields
      if (packageJson.name) {
        packageJson.name = this.replacePlaceholders(packageJson.name, context);
      }

      if (packageJson.description) {
        packageJson.description = this.replacePlaceholders(packageJson.description, context);
      }

      if (packageJson.author) {
        if (typeof packageJson.author === "string") {
          packageJson.author = this.replacePlaceholders(packageJson.author, context);
        } else if (typeof packageJson.author === "object") {
          if (packageJson.author.name) {
            packageJson.author.name = context.authorName;
          }
          if (packageJson.author.email) {
            packageJson.author.email = context.authorEmail;
          }
        }
      }

      // Set version to 0.1.0 for new projects
      packageJson.version = "0.1.0";

      if (!options.dryRun) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
        this.logger.debug("Updated package.json");
      }
    } catch {
      this.logger.debug("No package.json found or error processing it");
    }
  }

  /**
   * Replace placeholders in text
   */
  private replacePlaceholders(text: string, context: PlaceholderContext): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = context[key as keyof PlaceholderContext];
      if (value !== undefined) {
        return String(value);
      }
      return match;
    });
  }

  /**
   * Process filename placeholders
   */
  private processFilename(filename: string, context: PlaceholderContext): string {
    return this.replacePlaceholders(filename, context);
  }

  /**
   * Check if a file is binary
   */
  private async isBinaryFile(filePath: string): Promise<boolean> {
    const binaryExtensions = new Set([
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".ico",
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
      ".7z",
      ".ttf",
      ".otf",
      ".woff",
      ".woff2",
      ".eot",
      ".mp3",
      ".mp4",
      ".avi",
      ".mov",
      ".webm",
      ".exe",
      ".dll",
      ".so",
      ".dylib",
    ]);

    const ext = path.extname(filePath).toLowerCase();
    if (binaryExtensions.has(ext)) {
      return true;
    }

    // For other files, check content
    try {
      const buffer = await fs.readFile(filePath);
      const slice = buffer.slice(0, Math.min(8000, buffer.length));

      // Check for null bytes
      for (let i = 0; i < slice.length; i++) {
        if (slice[i] === 0) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}

// Export convenience functions
export const templateProcessor = new TemplateProcessor();

export async function processTemplate(
  sourcePath: string,
  targetPath: string,
  answers: ScaffoldPromptAnswers,
  config: TemplateConfig,
  options?: ProcessingOptions
): Promise<void> {
  return templateProcessor.processTemplate(sourcePath, targetPath, answers, config, options);
}
