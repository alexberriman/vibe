import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import { scanDirectory } from "../../utils/directory-scanner.js";
import { detectStorybookConfig } from "../../utils/storybook-config-detector.js";

type StorybookUrlsOptions = {
  readonly path?: string;
  readonly extensions?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
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
 * Generate Storybook URLs from a list of story files
 */
function generateStorybookUrls({
  files,
  port = 6006,
  filter,
}: {
  readonly files: string[];
  readonly port?: number;
  readonly filter?: string;
}): string[] {
  // Filter the files if a filter pattern is provided
  const filteredFiles = filter ? files.filter((file) => file.includes(filter)) : files;

  // Generate Storybook URLs
  return filteredFiles.map((file) => {
    // Extract the component name and stories from the file
    // This is a simplified approach and would need to be enhanced
    // to actually parse the story files in a future implementation
    const fileName = path.basename(file).replace(/\.stories\.(tsx|jsx|ts|js)$/, "");

    // Generate a simple URL for now - this would be improved in future tasks
    // that parse the actual stories from the file
    return `http://localhost:${port}/?path=/story/${fileName.toLowerCase()}--primary`;
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
      ".stories.tsx,.stories.jsx,.stories.ts,.stories.js"
    )
    .option("-P, --port <port>", "Storybook server port", "6006")
    .option("-o, --output <output>", "Output file path (default: print to console)")
    .option("--pretty", "Pretty print the JSON output", false)
    .option("-f, --filter <filter>", "Filter stories by pattern")
    .action(async (options: StorybookUrlsOptions) => {
      try {
        const dirPath = options.path || ".";
        let port = options.port ? Number(options.port) : 0;
        const extensions = options.extensions
          ? parseExtensions(options.extensions)
          : [".stories.tsx", ".stories.jsx", ".stories.ts", ".stories.js"];

        logger.info(`Scanning directory: ${dirPath}`);

        // Detect Storybook configuration
        logger.info("Detecting Storybook configuration...");
        const configResult = await detectStorybookConfig({ basePath: dirPath, logger });

        if (configResult.configPath) {
          logger.info(`Found Storybook configuration: ${configResult.configPath}`);

          // Use detected port if available and no port was specified via options
          if (configResult.port && !options.port) {
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

        logger.info(`Looking for files with extensions: ${extensions.join(", ")}`);

        // Scan the directory for story files
        const files = await scanDirectory({
          basePath: dirPath,
          fileExtensions: extensions,
          logger,
        });

        logger.info(`Found ${files.length} story files`);
        logger.info("Generating Storybook URLs...");

        // Generate Storybook URLs from the files
        const urls = generateStorybookUrls({
          files,
          port,
          filter: options.filter,
        });

        if (options.output) {
          logger.info(`Writing output to: ${options.output}`);
          // Write the output to a file
          const output = options.pretty ? JSON.stringify(urls, null, 2) : JSON.stringify(urls);
          await fs.writeFile(options.output, output, "utf8");
        } else {
          // Pretty print JSON if requested
          const output = options.pretty ? JSON.stringify(urls, null, 2) : JSON.stringify(urls);

          console.log(output);
        }

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
