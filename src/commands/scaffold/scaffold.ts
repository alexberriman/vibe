import { Command } from "commander";
import { createLogger } from "../../utils/logger.js";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { runInteractivePrompts, getTemplateInfo, getAllTemplates } from "./prompts.js";
import type { ScaffoldPromptAnswers } from "./prompts.js";
import { templateRegistry } from "./template-registry.js";
import type { TemplateConfig } from "./template-registry.js";
import type { Logger } from "pino";
import { cloneTemplate, initializeRepository } from "./git-operations.js";
import { processTemplate } from "./template-processor.js";
import { runPostProcessing, getDefaultPostProcessingSteps } from "./post-processor.js";

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
  license?: string;
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
        license: options.license,
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
        license: options.license || "MIT",
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
    } catch {
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
    const postProcessingSteps =
      templateConfig.postProcessing ||
      (await getDefaultPostProcessingSteps(scaffoldConfig.outputDirectory));
    await runPostProcessing(scaffoldConfig.outputDirectory, postProcessingSteps, {
      verbose: options.verbose,
    });

    // Success!
    logger.info("");
    logger.info(`✨ Project created successfully at ${scaffoldConfig.outputDirectory}`);
    logger.info("");

    // Display smart next steps
    await displayNextSteps(scaffoldConfig, templateConfig, logger);
  } catch (error) {
    logger.error("Failed to scaffold project", error);
    process.exit(1);
  }
}

/**
 * Display smart next steps based on template and project configuration
 */
async function displayNextSteps(
  config: ScaffoldPromptAnswers,
  templateConfig: TemplateConfig | null,
  logger: Logger
): Promise<void> {
  const relativeDir = path.relative(process.cwd(), config.outputDirectory);
  const hasPackageJson = await fileExists(path.join(config.outputDirectory, "package.json"));
  const hasDockerfile = await fileExists(path.join(config.outputDirectory, "Dockerfile"));
  const hasStorybookConfig = await fileExists(path.join(config.outputDirectory, ".storybook"));

  // Detect project type
  const isReactProject = config.template?.toLowerCase().includes("react") || false;
  const isNextJsProject = config.template?.toLowerCase().includes("next") || false;
  const isNodeProject = hasPackageJson;

  logger.info("Next steps:");
  logger.info("");

  // Step 1: Navigate to project
  logger.info(`1. Navigate to your project:`);
  logger.info(`   cd ${relativeDir}`);
  logger.info("");

  // Step 2: Development commands
  if (hasPackageJson) {
    logger.info(`2. Start development:`);
    if (isNextJsProject) {
      logger.info(`   npm run dev     # Start Next.js development server`);
      logger.info(`   npm run build   # Build for production`);
    } else if (isReactProject) {
      logger.info(`   npm run dev     # Start development server`);
      logger.info(`   npm run build   # Build for production`);
    } else {
      logger.info(`   npm run dev     # Start development mode`);
      logger.info(`   npm run build   # Build the project`);
    }
    logger.info(`   npm test        # Run tests`);
    logger.info("");
  }

  // Step 3: Additional tools
  let stepNumber = 3;
  if (hasStorybookConfig) {
    logger.info(`${stepNumber}. Run Storybook:`);
    logger.info(`   npm run storybook`);
    logger.info("");
    stepNumber++;
  }

  if (hasDockerfile) {
    logger.info(`${stepNumber}. Run with Docker:`);
    logger.info(`   docker build -t ${config.projectName.toLowerCase()} .`);
    logger.info(`   docker run -p 3000:3000 ${config.projectName.toLowerCase()}`);
    logger.info("");
    stepNumber++;
  }

  // Step 4: Template-specific guidance
  if (templateConfig?.guidance) {
    logger.info(`${stepNumber}. Template-specific guidance:`);
    for (const guidance of templateConfig.guidance) {
      logger.info(`   ${guidance}`);
    }
    logger.info("");
    stepNumber++;
  }

  // Final encouragement
  logger.info("📚 Learn more:");
  if (isReactProject) {
    logger.info("   React: https://react.dev");
  }
  if (isNextJsProject) {
    logger.info("   Next.js: https://nextjs.org/docs");
  }
  if (isNodeProject) {
    logger.info("   Node.js: https://nodejs.org/docs");
  }
  logger.info("");
  logger.info("Happy coding! 🚀");
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
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
    .option("-l, --license <license>", "Project license (MIT, Apache-2.0, GPL-3.0, etc.)")
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
