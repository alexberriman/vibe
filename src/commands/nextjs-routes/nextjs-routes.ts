import { Command } from "commander";
import fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import { scanDirectory } from "../../utils/directory-scanner.js";
import {
  detectNextjsStructure,
  type NextjsStructure,
} from "../../utils/nextjs-structure-detector.js";

type NextjsRoutesOptions = {
  readonly path?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
  readonly type?: string;
};

// This type will be used in future implementations
type _NextjsRouteInfo = {
  readonly path: string;
  readonly url: string;
  readonly type: "page" | "api";
  readonly hasDynamicSegments: boolean;
};

/**
 * Get the relevant file extensions for Next.js files
 */
function getNextjsFileExtensions(): string[] {
  return [".js", ".jsx", ".ts", ".tsx"];
}

/**
 * Scan a directory for Next.js routes
 */
async function scanNextjsProject(
  dirPath: string,
  logger = createLogger()
): Promise<{ files: string[]; structure: NextjsStructure }> {
  logger.info(`Scanning Next.js project directory: ${dirPath}`);

  // Detect Next.js project structure (app router and/or pages router)
  const structure = await detectNextjsStructure({
    basePath: dirPath,
    logger,
  });

  // Log structure detection results
  if (structure.hasAppRouter && structure.hasPagesRouter) {
    logger.info("Detected both App Router and Pages Router in the project");
  } else if (structure.hasAppRouter) {
    logger.info("Detected App Router in the project");
  } else if (structure.hasPagesRouter) {
    logger.info("Detected Pages Router in the project");
  } else {
    logger.warn("Could not detect Next.js router structure in the project");
  }

  const extensions = getNextjsFileExtensions();
  logger.info(`Looking for files with extensions: ${extensions.join(", ")}`);

  const files = await scanDirectory({
    basePath: dirPath,
    fileExtensions: extensions,
    logger,
  });

  logger.info(`Found ${files.length} files matching extensions`);
  return { files, structure };
}

/**
 * Create a nextjs-routes command
 */
export function nextjsRoutesCommand(): Command {
  const command = new Command("nextjs-routes");
  const logger = createLogger();

  command
    .description(
      "Analyzes a Next.js app directory and generates a JSON array of application routes as URLs"
    )
    .option("-p, --path <path>", "Directory path to scan for Next.js routes", ".")
    .option("-P, --port <port>", "Next.js development server port", "3000")
    .option("-o, --output <o>", "Output file path (default: print to console)")
    .option("--pretty", "Pretty print the JSON output", false)
    .option("-f, --filter <filter>", "Filter routes by pattern")
    .option("-t, --type <type>", "Filter by route type (page, api, all)", "all")
    .action(async (options: NextjsRoutesOptions) => {
      try {
        const dirPath = options.path || ".";

        // Scan the Next.js project directory and detect structure
        const { files, structure } = await scanNextjsProject(dirPath, logger);

        // TODO: Implement route parsing logic based on detected structure

        // Enhanced result including structure detection
        const result = {
          info: "Next.js routes analysis in development",
          scannedDirectory: dirPath,
          port: options.port || 3000,
          filesFound: files.length,
          structure: {
            hasAppRouter: structure.hasAppRouter,
            hasPagesRouter: structure.hasPagesRouter,
            appDirectory: structure.appDirectory || null,
            pagesDirectory: structure.pagesDirectory || null,
          },
        };

        // Format the output
        const output = options.pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);

        if (options.output) {
          logger.info(`Writing output to: ${options.output}`);
          await fs.writeFile(options.output, output, "utf8");
        } else {
          console.log(output);
        }

        logger.info("Next.js routes command executed successfully");
      } catch (error) {
        logger.error("Failed to analyze Next.js routes");
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  return command;
}
