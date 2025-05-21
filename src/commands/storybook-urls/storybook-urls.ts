import { Command } from "commander";
import { createLogger } from "../../utils/logger.js";

type StorybookUrlsOptions = {
  readonly path?: string;
  readonly extensions?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
};

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
        logger.info(`Scanning directory: ${options.path || "."}`);
        logger.info("Generating Storybook URLs...");

        // TODO: Implement the actual URL generation logic

        // Placeholder for the actual implementation
        const urls = [
          "http://localhost:6006/?path=/story/example-button--primary",
          "http://localhost:6006/?path=/story/example-button--secondary",
        ];

        if (options.output) {
          logger.info(`Writing output to: ${options.output}`);
          // TODO: Implement file writing logic
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
