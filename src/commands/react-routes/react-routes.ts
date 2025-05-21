import { Command } from "commander";
import fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import { scanDirectory } from "../../utils/directory-scanner.js";
import { detectViteConfig } from "../../utils/vite-config-detector.js";

type ReactRoutesOptions = {
  readonly path?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
  readonly extensions?: string;
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
  return [".tsx", ".jsx", ".ts", ".js"];
}

/**
 * Find router-related files in the directory
 */
async function findRouterFiles(
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

  logger.info(`Found ${files.length} files matching extensions`);
  return files;
}

/**
 * Detect Vite development port from configuration or options
 */
async function detectDevPort(
  dirPath: string,
  portOption?: number,
  logger = createLogger()
): Promise<number> {
  logger.info("Detecting Vite configuration...");
  const configResult = await detectViteConfig({ basePath: dirPath, logger });
  let port = portOption ? Number(portOption) : 0;

  if (configResult.configPath) {
    logger.info(`Found Vite configuration: ${configResult.configPath}`);

    // Use detected port if available and no port was specified via options
    if (configResult.port && !portOption) {
      port = configResult.port;
      logger.info(`Using detected Vite port: ${port}`);
    }
  } else {
    logger.info("No Vite configuration detected, using defaults");
  }

  // If no port was detected or specified, use the default
  if (port === 0) {
    port = 5173;
    logger.info(`Using default Vite port: ${port}`);
  }

  return port;
}

/**
 * Create a react-routes command
 */
export function reactRoutesCommand(): Command {
  const command = new Command("react-routes");
  const logger = createLogger();

  command
    .description(
      "Analyzes a React app directory and generates a JSON array of application routes as URLs"
    )
    .option("-p, --path <path>", "Directory path to scan for React router files", ".")
    .option("-P, --port <port>", "Development server port", "5173")
    .option("-o, --output <output>", "Output file path (default: print to console)")
    .option("--pretty", "Pretty print the JSON output", false)
    .option("-f, --filter <filter>", "Filter routes by pattern")
    .option(
      "-e, --extensions <extensions>",
      "Comma-separated list of file extensions to scan",
      ".tsx,.jsx,.ts,.js"
    )
    .action(async (options: ReactRoutesOptions) => {
      try {
        const dirPath = options.path || ".";

        // Get file extensions to scan
        const extensions = getFileExtensions(options.extensions);
        logger.info(`Looking for files with extensions: ${extensions.join(", ")}`);

        // Detect port for URL generation
        const _port = await detectDevPort(dirPath, options.port, logger);

        // Find potential router files
        const _files = await findRouterFiles(dirPath, extensions, logger);

        // TODO: Implement router detection and route generation

        // Placeholder implementation
        const routes: string[] = [];
        const output = options.pretty ? JSON.stringify(routes, null, 2) : JSON.stringify(routes);

        if (options.output) {
          logger.info(`Writing output to: ${options.output}`);
          await fs.writeFile(options.output, output, "utf8");
        } else {
          console.log(output);
        }

        logger.info("React routes generated successfully");
      } catch (error) {
        logger.error("Failed to generate React routes");
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  return command;
}
