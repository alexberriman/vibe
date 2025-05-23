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
import { ErrorHandler, ScaffoldErrorType, ScaffoldError } from "./error-handler.js";

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
  const errorHandler = new ErrorHandler(options.verbose);
  let currentContext = ErrorHandler.createContext("initialization");

  // Handle user cancellation
  process.on("SIGINT", async () => {
    await errorHandler.handleCancellation(currentContext);
  });

  try {
    logger.info("Starting project scaffolding...");

    if (options.dryRun) {
      logger.info("Running in dry-run mode - no changes will be made");
    }

    let scaffoldConfig: ScaffoldPromptAnswers;

    // Check if we're in interactive mode
    const isInteractive = !options.template || !options.name;

    currentContext = ErrorHandler.createContext("prompt-handling");

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
      const answers = await errorHandler.wrapOperation(
        () => runInteractivePrompts(promptOptions),
        currentContext
      );

      if (!answers) {
        await errorHandler.handleCancellation(currentContext);
        return;
      }

      scaffoldConfig = answers;
    } else {
      // Non-interactive mode - validate required options
      if (!options.template) {
        throw new ScaffoldError(
          ScaffoldErrorType.VALIDATION_ERROR,
          "Template is required in non-interactive mode",
          currentContext
        );
      }

      if (!options.name) {
        throw new ScaffoldError(
          ScaffoldErrorType.VALIDATION_ERROR,
          "Project name is required in non-interactive mode",
          currentContext
        );
      }

      // Validate template exists
      const templateInfo = getTemplateInfo(options.template);
      if (!templateInfo) {
        const availableTemplates = getAllTemplates()
          .map((t) => `  - ${t.name}: ${t.description}`)
          .join("\n");
        throw new ScaffoldError(
          ScaffoldErrorType.VALIDATION_ERROR,
          `Unknown template: ${options.template}\n\nAvailable templates:\n${availableTemplates}`,
          currentContext
        );
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

    // Update context with configuration
    currentContext = ErrorHandler.createContext("directory-setup", {
      template: scaffoldConfig.template,
      outputDirectory: scaffoldConfig.outputDirectory,
    });

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
    await errorHandler.wrapOperation(async () => {
      try {
        const stats = await fs.stat(scaffoldConfig.outputDirectory);
        if (stats.isDirectory() && !scaffoldConfig.confirmOverwrite) {
          throw new ScaffoldError(
            ScaffoldErrorType.VALIDATION_ERROR,
            `Directory already exists: ${scaffoldConfig.outputDirectory}\nUse --force to overwrite or choose a different directory`,
            currentContext
          );
        }

        if (scaffoldConfig.confirmOverwrite) {
          logger.info("Removing existing directory...");
          await fs.rm(scaffoldConfig.outputDirectory, { recursive: true, force: true });
        }
      } catch (error) {
        if (error instanceof ScaffoldError) {
          throw error;
        }
        // Directory doesn't exist, which is fine
      }
    }, currentContext);

    // Get template info
    const templateInfo = getTemplateInfo(scaffoldConfig.template);
    if (!templateInfo) {
      throw new ScaffoldError(
        ScaffoldErrorType.TEMPLATE_ERROR,
        `Template not found: ${scaffoldConfig.template}`,
        currentContext
      );
    }

    // Clone template
    currentContext = ErrorHandler.createContext("template-cloning", {
      template: scaffoldConfig.template,
      outputDirectory: scaffoldConfig.outputDirectory,
      partiallyCreated: true,
    });

    logger.info("Cloning template repository...");
    await errorHandler.wrapOperation(
      () =>
        cloneTemplate(templateInfo.repository, scaffoldConfig.outputDirectory, {
          branch: templateInfo.branch,
          verbose: options.verbose,
        }),
      currentContext
    );

    // Load template config
    currentContext = ErrorHandler.createContext("template-config-loading", {
      template: scaffoldConfig.template,
      outputDirectory: scaffoldConfig.outputDirectory,
      partiallyCreated: true,
    });

    const templateConfig = await errorHandler.wrapOperation(
      () => templateRegistry.loadTemplateConfig(scaffoldConfig.template),
      currentContext
    );

    if (!templateConfig) {
      throw new ScaffoldError(
        ScaffoldErrorType.TEMPLATE_ERROR,
        "Failed to load template configuration - template may be invalid or missing scaffold.config.json",
        currentContext
      );
    }

    // Process template files
    currentContext = ErrorHandler.createContext("template-processing", {
      template: scaffoldConfig.template,
      outputDirectory: scaffoldConfig.outputDirectory,
      partiallyCreated: true,
    });

    logger.info("Processing template files...");
    await errorHandler.wrapOperation(
      () =>
        processTemplate(
          scaffoldConfig.outputDirectory,
          scaffoldConfig.outputDirectory,
          scaffoldConfig,
          templateConfig,
          { verbose: options.verbose }
        ),
      currentContext
    );

    // Initialize git repository
    currentContext = ErrorHandler.createContext("git-initialization", {
      template: scaffoldConfig.template,
      outputDirectory: scaffoldConfig.outputDirectory,
      partiallyCreated: true,
    });

    logger.info("Initializing git repository...");
    await errorHandler.wrapOperation(
      () =>
        initializeRepository(scaffoldConfig.outputDirectory, {
          authorName: scaffoldConfig.authorName,
          authorEmail: scaffoldConfig.authorEmail,
          verbose: options.verbose,
        }),
      currentContext
    );

    // Run post-processing
    currentContext = ErrorHandler.createContext("post-processing", {
      template: scaffoldConfig.template,
      outputDirectory: scaffoldConfig.outputDirectory,
      partiallyCreated: true,
    });

    const postProcessingSteps =
      templateConfig.postProcessing ||
      (await getDefaultPostProcessingSteps(scaffoldConfig.outputDirectory));

    await errorHandler.wrapOperation(
      () =>
        runPostProcessing(scaffoldConfig.outputDirectory, postProcessingSteps, {
          verbose: options.verbose,
        }),
      currentContext
    );

    // Success!
    logger.info("");
    logger.info(`✨ Project created successfully at ${scaffoldConfig.outputDirectory}`);
    logger.info("");

    // Display smart next steps
    await displayNextSteps(scaffoldConfig, templateConfig, logger);
  } catch (error) {
    await errorHandler.handleError(error as Error, currentContext);
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
