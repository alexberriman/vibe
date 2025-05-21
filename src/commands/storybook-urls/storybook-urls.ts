import { Command } from "commander";
// Path import removed as it's not used in main file
import fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import { scanDirectory } from "../../utils/directory-scanner.js";
import { detectStorybookConfig } from "../../utils/storybook-config-detector.js";
import { parseStoryFiles, type StoryMetadata } from "../../utils/story-parsers/index.js";
import { ProgressIndicator } from "../../utils/progress-indicator.js";

type StorybookUrlsOptions = {
  readonly path?: string;
  readonly extensions?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
  readonly frameUrl?: boolean;
  readonly progress?: boolean;
};

/**
 * Parse a list of comma-separated extensions
 */
function parseExtensions(extensions: string): string[] {
  return extensions
    .split(",")
    .map((ext) => ext.trim())
    .filter(Boolean);
}

/**
 * Get file extensions to scan for
 */
function getFileExtensions(extensionsOption?: string): string[] {
  if (extensionsOption) {
    return parseExtensions(extensionsOption);
  }
  return [".stories.tsx", ".stories.jsx", ".stories.ts", ".stories.js", ".stories.mdx"];
}

/**
 * Detect Storybook port from configuration or options
 */
async function detectStorybookPort(
  dirPath: string,
  portOption?: number,
  logger = createLogger()
): Promise<number> {
  logger.info("Detecting Storybook configuration...");
  const configResult = await detectStorybookConfig({ basePath: dirPath, logger });
  let port = portOption ? Number(portOption) : 0;

  if (configResult.configPath) {
    logger.info(`Found Storybook configuration: ${configResult.configPath}`);

    // Use detected port if available and no port was specified via options
    if (configResult.port && !portOption) {
      port = configResult.port;
      logger.info(`Using detected Storybook port: ${port}`);
    }
  } else {
    logger.info("No Storybook configuration detected, using defaults");
  }

  // If no port was detected or specified, use the default
  if (port === 0) {
    port = 6006;
    logger.info(`Using default Storybook port: ${port}`);
  }

  return port;
}

/**
 * Find story files in the directory
 */
async function findStoryFiles(
  dirPath: string,
  extensions: string[],
  logger = createLogger()
): Promise<string[]> {
  logger.info(`Scanning directory: ${dirPath}`);

  const files = await scanDirectory({
    basePath: dirPath,
    fileExtensions: extensions,
    logger,
  });

  logger.info(`Found ${files.length} story files`);
  return files;
}

/**
 * Process story files to extract stories and generate URLs
 */
async function processStories(
  files: string[],
  port: number,
  options: StorybookUrlsOptions,
  logger = createLogger()
): Promise<string[]> {
  // Parse the story files to extract story metadata
  logger.info("Parsing story files...");

  let progress: ProgressIndicator | undefined;

  // Initialize progress indicator if requested
  if (options.progress) {
    progress = new ProgressIndicator({
      total: files.length,
      title: "Parsing Story Files",
      logger,
    });
  }

  const stories = await parseStoryFiles({
    filePaths: files,
    logger,
    onProgress: (current, _total) => {
      if (progress) {
        progress.update(current);
      }
    },
  });

  // Complete the progress indicator if it was used
  if (progress) {
    progress.complete();
  }

  logger.info(`Found ${stories.length} stories in ${files.length} files`);
  logger.info("Generating Storybook URLs...");

  // Generate Storybook URLs from the parsed stories
  return generateStorybookUrls({
    stories,
    port,
    filter: options.filter,
    useFrameUrl: options.frameUrl,
  });
}

/**
 * Output URLs to file or console
 */
async function outputUrls(
  urls: string[],
  options: StorybookUrlsOptions,
  logger = createLogger()
): Promise<void> {
  const output = options.pretty ? JSON.stringify(urls, null, 2) : JSON.stringify(urls);

  if (options.output) {
    logger.info(`Writing output to: ${options.output}`);
    await fs.writeFile(options.output, output, "utf8");
  } else {
    console.log(output);
  }
}

/**
 * Generate Storybook URLs from parsed stories
 */
function generateStorybookUrls({
  stories,
  port = 6006,
  filter,
  useFrameUrl = false,
}: {
  readonly stories: StoryMetadata[];
  readonly port?: number;
  readonly filter?: string;
  readonly useFrameUrl?: boolean;
}): string[] {
  // Filter the stories if a filter pattern is provided
  const filteredStories = filter
    ? stories.filter(
        (story) =>
          story.componentName.includes(filter) ||
          story.name.includes(filter) ||
          (story.title && story.title.includes(filter))
      )
    : stories;

  // Generate Storybook URLs based on the story metadata
  return filteredStories.map((story) => {
    // Generate URL based on story ID
    const baseUrl = `http://localhost:${port}`;

    // Determine whether to use the frame URL or the regular story URL
    if (useFrameUrl) {
      return `${baseUrl}/iframe.html?id=${story.id}&viewMode=story`;
    } else {
      return `${baseUrl}/?path=/story/${story.id}`;
    }
  });
}

/**
 * Create a storybook-urls command
 */
export function storybookUrlsCommand(): Command {
  const command = new Command("storybook-urls");
  const logger = createLogger();

  command
    .description("Generate a JSON array of Storybook URLs by scanning a directory for story files")
    .option("-p, --path <path>", "Directory path to scan for story files", ".")
    .option(
      "-e, --extensions <extensions>",
      "Comma-separated list of file extensions to scan",
      ".stories.tsx,.stories.jsx,.stories.ts,.stories.js,.stories.mdx"
    )
    .option("-P, --port <port>", "Storybook server port", "6006")
    .option("-o, --output <output>", "Output file path (default: print to console)")
    .option("--pretty", "Pretty print the JSON output", false)
    .option("-f, --filter <filter>", "Filter stories by pattern")
    .option("--frame-url", "Generate iframe URLs instead of story URLs", false)
    .option("--progress", "Show progress indicator for large codebases", false)
    .action(async (options: StorybookUrlsOptions) => {
      try {
        const dirPath = options.path || ".";

        // Get file extensions to scan
        const extensions = getFileExtensions(options.extensions);
        logger.info(`Looking for files with extensions: ${extensions.join(", ")}`);

        // Detect port and configuration
        const port = await detectStorybookPort(dirPath, options.port, logger);

        // Find story files
        const files = await findStoryFiles(dirPath, extensions, logger);

        // Parse stories and generate URLs
        const urls = await processStories(files, port, options, logger);

        // Output results
        outputUrls(urls, options, logger);

        logger.info("Storybook URLs generated successfully");
      } catch (error) {
        logger.error("Failed to generate Storybook URLs");
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  return command;
}
