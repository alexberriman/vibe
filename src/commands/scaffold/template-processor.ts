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

      // Set license field
      if (context.license) {
        packageJson.license = context.license;
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

    // Generate README.md if it doesn't exist
    await this.generateReadmeIfNeeded(targetPath, context, options);
  }

  /**
   * Generate README.md if it doesn't already exist
   */
  private async generateReadmeIfNeeded(
    targetPath: string,
    context: PlaceholderContext,
    options: ProcessingOptions
  ): Promise<void> {
    const readmePath = path.join(targetPath, "README.md");

    // Check if README.md already exists
    try {
      await fs.access(readmePath);
      this.logger.debug("README.md already exists, skipping generation");
      return;
    } catch {
      // README.md doesn't exist, generate it
    }

    const readmeContent = this.generateReadmeContent(context);

    if (!options.dryRun) {
      await fs.writeFile(readmePath, readmeContent, "utf-8");
      this.logger.debug("Generated README.md");
    }
  }

  /**
   * Generate README.md content based on project context
   */
  private generateReadmeContent(context: PlaceholderContext): string {
    const { projectName, description, authorName, license, template } = context;

    // Detect project type for customized instructions
    const isReactProject = template?.toLowerCase().includes("react") || false;
    const isNodeProject = true; // Most templates will be Node.js based

    const sections = [
      `# ${projectName}`,
      ``,
      `${description}`,
      ``,
      `## Features`,
      ``,
      `- 🚀 Modern development setup`,
      `- 📝 TypeScript support`,
      `- 🎨 ${isReactProject ? "React components" : "Clean architecture"}`,
      `- ✅ Testing configured`,
      `- 🔧 Development tools included`,
      ``,
      `## Getting Started`,
      ``,
      `### Prerequisites`,
      ``,
      `- Node.js 18+ installed`,
      `- npm or yarn package manager`,
      ``,
      `### Installation`,
      ``,
      `1. Clone the repository:`,
      `\`\`\`bash`,
      `git clone <your-repo-url>`,
      `cd ${this.toKebabCase(projectName)}`,
      `\`\`\``,
      ``,
      `2. Install dependencies:`,
      `\`\`\`bash`,
      `npm install`,
      `\`\`\``,
      ``,
      `3. Start the development server:`,
      `\`\`\`bash`,
      `npm run dev`,
      `\`\`\``,
      ``,
      `## Available Scripts`,
      ``,
      `\`\`\`bash`,
      `npm run dev      # Start development server`,
      `npm run build    # Build for production`,
      `npm run test     # Run tests`,
      `npm run lint     # Run linter`,
      `npm run format   # Format code`,
      `\`\`\``,
      ``,
      `## Project Structure`,
      ``,
      `\`\`\``,
      `${this.toKebabCase(projectName)}/`,
      `├── src/           # Source code`,
      isReactProject ? `├── public/        # Public assets` : `├── lib/           # Library code`,
      `├── tests/         # Test files`,
      `├── docs/          # Documentation`,
      `└── package.json   # Project configuration`,
      `\`\`\``,
      ``,
      `## Contributing`,
      ``,
      `1. Fork the repository`,
      `2. Create your feature branch: \`git checkout -b feature/amazing-feature\``,
      `3. Commit your changes: \`git commit -m 'Add amazing feature'\``,
      `4. Push to the branch: \`git push origin feature/amazing-feature\``,
      `5. Open a Pull Request`,
      ``,
      `## License`,
      ``,
      `This project is licensed under the ${license || "MIT"} License - see the [LICENSE](LICENSE) file for details.`,
      ``,
      `## Author`,
      ``,
      `Created by **${authorName || "Unknown"}**`,
      ``,
      `---`,
      ``,
      `*Generated with [Vibe CLI](https://github.com/alexberriman/vibe) 🚀*`,
    ];

    return sections.join("\n");
  }

  /**
   * Replace placeholders in text with advanced transformations
   */
  private replacePlaceholders(text: string, context: PlaceholderContext): string {
    return text.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, key) => {
      // Handle transformation functions like {{projectName.kebab}}
      const [mainKey, transform] = key.split(".");
      const value = context[mainKey as keyof PlaceholderContext];

      if (value !== undefined) {
        const stringValue = String(value);

        // Apply transformation if specified
        switch (transform) {
          case "kebab":
            return this.toKebabCase(stringValue);
          case "camel":
            return this.toCamelCase(stringValue);
          case "pascal":
            return this.toPascalCase(stringValue);
          case "snake":
            return this.toSnakeCase(stringValue);
          case "upper":
            return stringValue.toUpperCase();
          case "lower":
            return stringValue.toLowerCase();
          default:
            return stringValue;
        }
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
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
      .replace(/^[A-Z]/, (char) => char.toLowerCase());
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
      .replace(/^[a-z]/, (char) => char.toUpperCase());
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase();
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
