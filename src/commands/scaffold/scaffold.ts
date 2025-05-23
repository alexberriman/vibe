import { Command } from "commander";
import { createLogger } from "../../utils/logger.js";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { runInteractivePrompts, getTemplateInfo, getAllTemplates } from "./prompts.js";
import type { ScaffoldPromptAnswers } from "./prompts.js";
import { templateRegistry } from "./template-registry.js";
import { cloneTemplate, initializeRepository } from "./git-operations.js";
import { processTemplate } from "./template-processor.js";
import { runPostProcessing, getDefaultPostProcessingSteps } from "./post-processor.js";
import { validateTemplate } from "./template-validator.js";

export interface ScaffoldOptions {
  template?: string;
  force?: boolean;
  defaults?: boolean;
  dryRun?: boolean;
  output?: string;
  verbose?: boolean;
  name?: string;
  description?: string;
  author?: string;
  email?: string;
}

export async function scaffoldCommand(options: ScaffoldOptions): Promise<void> {
  const logger = createLogger({ level: options.verbose ? "debug" : "info" });

  try {
    logger.info("Starting project scaffolding...");

    if (options.dryRun) {
      logger.info("Running in dry-run mode - no changes will be made");
    }

    let scaffoldConfig: ScaffoldPromptAnswers;

    // Check if we're in interactive mode
    const isInteractive = !options.template || !options.name;

    if (isInteractive) {
      logger.info("Running in interactive mode");

      // Prepare initial values from CLI options
      const promptOptions: Partial<ScaffoldPromptAnswers> = {
        template: options.template,
        projectName: options.name,
        description: options.description,
        authorName: options.author,
        authorEmail: options.email,
        outputDirectory: options.output ? path.resolve(options.output) : undefined,
        confirmOverwrite: options.force,
      };

      // Run interactive prompts
      const answers = await runInteractivePrompts(promptOptions);

      if (!answers) {
        logger.info("Scaffolding cancelled by user");
        process.exit(0);
      }

      scaffoldConfig = answers;
    } else {
      // Non-interactive mode - validate required options
      if (!options.template) {
        logger.error("Template is required in non-interactive mode");
        process.exit(1);
      }

      if (!options.name) {
        logger.error("Project name is required in non-interactive mode");
        process.exit(1);
      }

      // Validate template exists
      const templateInfo = getTemplateInfo(options.template);
      if (!templateInfo) {
        logger.error(`Unknown template: ${options.template}`);
        logger.info("Available templates:");
        getAllTemplates().forEach((t) => {
          logger.info(`  - ${t.name}: ${t.description}`);
        });
        process.exit(1);
      }

      // Build config from CLI options
      scaffoldConfig = {
        template: options.template,
        projectName: options.name,
        description: options.description || "A new project",
        authorName: options.author || "",
        authorEmail: options.email || "",
        outputDirectory: path.resolve(options.output || path.join(process.cwd(), options.name)),
        confirmOverwrite: options.force,
      };
    }

    // Log the configuration
    logger.info("Scaffolding configuration:");
    logger.info(`  Template: ${scaffoldConfig.template}`);
    logger.info(`  Project: ${scaffoldConfig.projectName}`);
    logger.info(`  Output: ${scaffoldConfig.outputDirectory}`);

    if (options.dryRun) {
      logger.info("Dry-run complete - no changes were made");
      return;
    }

    // Check if output directory exists
    try {
      const stats = await fs.stat(scaffoldConfig.outputDirectory);
      if (stats.isDirectory() && !scaffoldConfig.confirmOverwrite) {
        logger.error(`Directory already exists: ${scaffoldConfig.outputDirectory}`);
        logger.error("Use --force to overwrite or choose a different directory");
        process.exit(1);
      }
      
      if (scaffoldConfig.confirmOverwrite) {
        logger.info("Removing existing directory...");
        await fs.rm(scaffoldConfig.outputDirectory, { recursive: true, force: true });
      }
    } catch (error) {
      // Directory doesn't exist, which is fine
    }

    // Get template info
    const templateInfo = getTemplateInfo(scaffoldConfig.template);
    if (!templateInfo) {
      logger.error(`Template not found: ${scaffoldConfig.template}`);
      process.exit(1);
    }

    // Clone template
    logger.info("Cloning template repository...");
    await cloneTemplate(templateInfo.repository, scaffoldConfig.outputDirectory, {
      branch: templateInfo.branch,
      verbose: options.verbose,
    });

    // Load template config
    const templateConfig = await templateRegistry.loadTemplateConfig(scaffoldConfig.template);
    if (!templateConfig) {
      logger.error("Failed to load template configuration");
      process.exit(1);
    }

    // Process template files
    logger.info("Processing template files...");
    await processTemplate(
      scaffoldConfig.outputDirectory,
      scaffoldConfig.outputDirectory,
      scaffoldConfig,
      templateConfig,
      { verbose: options.verbose }
    );

    // Initialize git repository
    logger.info("Initializing git repository...");
    await initializeRepository(scaffoldConfig.outputDirectory, {
      authorName: scaffoldConfig.authorName,
      authorEmail: scaffoldConfig.authorEmail,
      verbose: options.verbose,
    });

    // Run post-processing
    const postProcessingSteps = templateConfig.postProcessing || getDefaultPostProcessingSteps();
    await runPostProcessing(scaffoldConfig.outputDirectory, postProcessingSteps, {
      verbose: options.verbose,
    });

    // Success!
    logger.info("");
    logger.info(`✨ Project created successfully at ${scaffoldConfig.outputDirectory}`);
    logger.info("");
    logger.info("Next steps:");
    logger.info(`  cd ${path.relative(process.cwd(), scaffoldConfig.outputDirectory)}`);
    logger.info("  npm run dev");
    logger.info("");
    logger.info("Happy coding! 🚀");
  } catch (error) {
    logger.error("Failed to scaffold project", error);
    process.exit(1);
  }
}

export function createScaffoldCommand(): Command {
  const command = new Command("scaffold")
    .description("Scaffold a new project from a template")
    .option("-t, --template <name>", "Template to use")
    .option("-n, --name <name>", "Project name (required for non-interactive mode)")
    .option("-d, --description <description>", "Project description")
    .option("-a, --author <name>", "Author name")
    .option("-e, --email <email>", "Author email")
    .option("-o, --output <path>", "Output directory (defaults to ./<project-name>)")
    .option("-f, --force", "Overwrite existing directory", false)
    .option("--defaults", "Use default values for optional prompts", false)
    .option("--dry-run", "Preview changes without executing", false)
    .option("-v, --verbose", "Enable verbose logging", false)
    .action(async (options: ScaffoldOptions) => {
      await scaffoldCommand(options);
    });

  return command;
}
