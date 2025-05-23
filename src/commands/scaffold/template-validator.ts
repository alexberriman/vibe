import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createLogger } from "../../utils/logger.js";
import type { TemplateConfig } from "./template-registry.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateStructure {
  hasPackageJson: boolean;
  hasReadme: boolean;
  hasScaffoldConfig: boolean;
  hasGitignore: boolean;
  hasSrcDirectory: boolean;
  hasIndexFile: boolean;
}

/**
 * Template validator for ensuring template integrity
 */
export class TemplateValidator {
  private logger = createLogger();

  /**
   * Validate a template directory
   */
  async validateTemplate(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if template directory exists
      const stats = await fs.stat(templatePath);
      if (!stats.isDirectory()) {
        errors.push(`Template path is not a directory: ${templatePath}`);
        return { valid: false, errors, warnings };
      }

      // Check template structure
      const structure = await this.checkTemplateStructure(templatePath);

      // Validate required files
      if (!structure.hasPackageJson) {
        errors.push("Missing required file: package.json");
      }

      if (!structure.hasReadme) {
        warnings.push("Missing README.md - recommended for template documentation");
      }

      if (!structure.hasGitignore) {
        warnings.push("Missing .gitignore - recommended for version control");
      }

      if (!structure.hasSrcDirectory && !structure.hasIndexFile) {
        warnings.push("Missing src/ directory or index file - template might lack entry point");
      }

      // Validate package.json if it exists
      if (structure.hasPackageJson) {
        const packageJsonResult = await this.validatePackageJson(templatePath);
        errors.push(...packageJsonResult.errors);
        warnings.push(...packageJsonResult.warnings);
      }

      // Validate scaffold.config.json if it exists
      if (structure.hasScaffoldConfig) {
        const configResult = await this.validateScaffoldConfig(templatePath);
        errors.push(...configResult.errors);
        warnings.push(...configResult.warnings);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Failed to validate template: ${error instanceof Error ? error.message : String(error)}`
      );
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Check template directory structure
   */
  private async checkTemplateStructure(templatePath: string): Promise<TemplateStructure> {
    const structure: TemplateStructure = {
      hasPackageJson: false,
      hasReadme: false,
      hasScaffoldConfig: false,
      hasGitignore: false,
      hasSrcDirectory: false,
      hasIndexFile: false,
    };

    try {
      const files = await fs.readdir(templatePath);

      for (const file of files) {
        const lowerFile = file.toLowerCase();

        if (file === "package.json") {
          structure.hasPackageJson = true;
        } else if (lowerFile === "readme.md" || lowerFile === "readme") {
          structure.hasReadme = true;
        } else if (file === "scaffold.config.json") {
          structure.hasScaffoldConfig = true;
        } else if (file === ".gitignore") {
          structure.hasGitignore = true;
        } else if (file === "src") {
          const srcPath = path.join(templatePath, file);
          const srcStats = await fs.stat(srcPath);
          if (srcStats.isDirectory()) {
            structure.hasSrcDirectory = true;
          }
        } else if (file.startsWith("index.")) {
          structure.hasIndexFile = true;
        }
      }
    } catch (error) {
      this.logger.error("Failed to check template structure", error);
    }

    return structure;
  }

  /**
   * Validate package.json file
   */
  private async validatePackageJson(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const packageJsonPath = path.join(templatePath, "package.json");
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      // Check for template placeholders
      const placeholderPattern = /\{\{[^}]+\}\}/;

      if (!packageJson.name || !placeholderPattern.test(packageJson.name)) {
        warnings.push("package.json name should contain placeholders like {{projectName}}");
      }

      if (!packageJson.description || !placeholderPattern.test(packageJson.description)) {
        warnings.push("package.json description should contain placeholders like {{description}}");
      }

      if (!packageJson.version) {
        errors.push("package.json missing required field: version");
      }

      // Check for author placeholder
      if (packageJson.author && typeof packageJson.author === "string") {
        if (!placeholderPattern.test(packageJson.author)) {
          warnings.push("package.json author should contain placeholders like {{authorName}}");
        }
      }

      // Validate scripts
      if (!packageJson.scripts) {
        warnings.push("package.json missing scripts section");
      } else {
        const recommendedScripts = ["dev", "build", "test", "lint"];
        for (const script of recommendedScripts) {
          if (!packageJson.scripts[script]) {
            warnings.push(`package.json missing recommended script: ${script}`);
          }
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push("package.json contains invalid JSON");
      } else {
        errors.push(
          `Failed to validate package.json: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate scaffold.config.json file
   */
  private async validateScaffoldConfig(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const configPath = path.join(templatePath, "scaffold.config.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config: TemplateConfig = JSON.parse(content);

      // Validate required fields
      if (!config.name) {
        errors.push("scaffold.config.json missing required field: name");
      }

      if (!config.description) {
        errors.push("scaffold.config.json missing required field: description");
      }

      // Validate prompts if present
      if (config.prompts) {
        if (!Array.isArray(config.prompts)) {
          errors.push("scaffold.config.json prompts must be an array");
        } else {
          config.prompts.forEach((prompt, index) => {
            if (!prompt.name) {
              errors.push(`scaffold.config.json prompt[${index}] missing required field: name`);
            }
            if (!prompt.message) {
              errors.push(`scaffold.config.json prompt[${index}] missing required field: message`);
            }
            if (!prompt.type) {
              errors.push(`scaffold.config.json prompt[${index}] missing required field: type`);
            }
            if (prompt.type && !["text", "select", "confirm", "number"].includes(prompt.type)) {
              errors.push(`scaffold.config.json prompt[${index}] has invalid type: ${prompt.type}`);
            }
          });
        }
      }

      // Validate placeholders if present
      if (config.placeholders) {
        if (typeof config.placeholders !== "object") {
          errors.push("scaffold.config.json placeholders must be an object");
        }
      }

      // Validate post-processing if present
      if (config.postProcessing) {
        if (!Array.isArray(config.postProcessing)) {
          errors.push("scaffold.config.json postProcessing must be an array");
        } else {
          config.postProcessing.forEach((step, index) => {
            if (!step.name) {
              errors.push(
                `scaffold.config.json postProcessing[${index}] missing required field: name`
              );
            }
            if (!step.command && !step.script) {
              errors.push(
                `scaffold.config.json postProcessing[${index}] must have either command or script`
              );
            }
          });
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push("scaffold.config.json contains invalid JSON");
      } else if ((error as { code?: string }).code === "ENOENT") {
        // File doesn't exist - this is ok, it's optional
        return { valid: true, errors: [], warnings: [] };
      } else {
        errors.push(
          `Failed to validate scaffold.config.json: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if a file exists in the template
   */
  async checkFileExists(templatePath: string, filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(templatePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of all files in template (excluding .git)
   */
  async getTemplateFiles(templatePath: string): Promise<string[]> {
    const files: string[] = [];

    async function walkDir(dir: string, baseDir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        // Skip .git directory
        if (entry.name === ".git") {
          continue;
        }

        if (entry.isDirectory()) {
          await walkDir(fullPath, baseDir);
        } else {
          files.push(relativePath);
        }
      }
    }

    await walkDir(templatePath, templatePath);
    return files;
  }
}

// Export convenience functions
export const templateValidator = new TemplateValidator();

export async function validateTemplate(templatePath: string): Promise<ValidationResult> {
  return templateValidator.validateTemplate(templatePath);
}

export async function checkFileExists(templatePath: string, filePath: string): Promise<boolean> {
  return templateValidator.checkFileExists(templatePath, filePath);
}

export async function getTemplateFiles(templatePath: string): Promise<string[]> {
  return templateValidator.getTemplateFiles(templatePath);
}
