import { Command } from "commander";
import fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import { scanDirectory } from "../../utils/directory-scanner.js";
import { detectViteConfig } from "../../utils/vite-config-detector.js";
import {
  findRouterDefinitionFiles,
  type RouterFileInfo,
} from "../../utils/react-router-detector.js";
import {
  parseJSXRoutes,
  parseObjectRoutes,
  parseDataRouterRoutes,
  type RouteInfo,
} from "../../utils/route-parsers/index.js";

type ReactRoutesOptions = {
  readonly path?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
  readonly extensions?: string;
};

type RouteUrl = {
  readonly path: string;
  readonly url: string;
  readonly hasDynamicSegments: boolean;
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
 * Extract routes from router files
 */
async function extractRoutes(
  routerFiles: RouterFileInfo[],
  logger = createLogger()
): Promise<RouteInfo[]> {
  const allRoutes: RouteInfo[] = [];

  for (const file of routerFiles) {
    logger.info(`Extracting routes from: ${file.filePath} (${file.routerType})`);

    try {
      if (file.routerType === "jsx") {
        // Parse JSX-style routes
        const routes = await parseJSXRoutes(file.filePath, { logger });
        allRoutes.push(...routes);
        logger.info(`Extracted ${routes.length} routes from ${file.filePath}`);
      } else if (file.routerType === "object") {
        // Parse object-based routes
        const routes = await parseObjectRoutes(file.filePath, { logger });
        allRoutes.push(...routes);
        logger.info(`Extracted ${routes.length} routes from ${file.filePath}`);
      } else if (file.routerType === "data-router") {
        // Parse data router API routes
        const routes = await parseDataRouterRoutes(file.filePath, { logger });
        allRoutes.push(...routes);
        logger.info(`Extracted ${routes.length} routes from ${file.filePath}`);
      }
    } catch (error) {
      logger.error(`Failed to extract routes from ${file.filePath}`);
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
  }

  return allRoutes;
}

/**
 * Generate URLs from route information
 */
function generateRouteUrls(routes: RouteInfo[], baseUrl: string, filter?: string): RouteUrl[] {
  const urls: RouteUrl[] = [];
  const filterRegex = filter ? new RegExp(filter, "i") : null;

  function processRoute(route: RouteInfo, parentUrl = ""): void {
    // Skip index routes (they use the parent URL)
    if (route.index) {
      const url = parentUrl || baseUrl;

      if (!filterRegex || filterRegex.test(url)) {
        urls.push({
          path: parentUrl || "/",
          url,
          hasDynamicSegments: false,
        });
      }

      return;
    }

    // Skip routes without a path
    if (!route.path) {
      return;
    }

    // Build the full URL
    const fullPath = route.path.startsWith("/")
      ? route.path
      : `${parentUrl}/${route.path}`.replace(/\/+/g, "/");

    const url = `${baseUrl}${fullPath}`;

    // Add the URL if it matches the filter (or if there's no filter)
    if (!filterRegex || filterRegex.test(url)) {
      urls.push({
        path: fullPath,
        url,
        hasDynamicSegments: route.hasDynamicSegments || false,
      });
    }

    // Process child routes
    if (route.children && route.children.length > 0) {
      for (const child of route.children) {
        processRoute(child, fullPath);
      }
    }
  }

  // Process all routes
  for (const route of routes) {
    processRoute(route);
  }

  return urls;
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
        const port = await detectDevPort(dirPath, options.port, logger);
        const baseUrl = `http://localhost:${port}`;
        logger.info(`Using base URL: ${baseUrl}`);

        // Find potential router files
        const files = await findRouterFiles(dirPath, extensions, logger);

        // Detect React Router definition files
        logger.info("Searching for React Router definition files...");
        const routerFiles = await findRouterDefinitionFiles(files, { logger });

        // Log detection results
        if (routerFiles.length > 0) {
          logger.info(`Found ${routerFiles.length} React Router definition files:`);
          routerFiles.forEach((file) => {
            logger.info(`- ${file.filePath} (type: ${file.routerType})`);
          });
        } else {
          logger.warn("No React Router definition files found in the scanned directory");
        }

        // Extract routes from router files
        const routes = await extractRoutes(routerFiles, logger);
        logger.info(`Total routes extracted: ${routes.length}`);

        // Generate URLs from route information
        const routeUrls = generateRouteUrls(routes, baseUrl, options.filter);
        logger.info(`Generated ${routeUrls.length} route URLs`);

        // Format the output
        const output = options.pretty
          ? JSON.stringify(routeUrls, null, 2)
          : JSON.stringify(routeUrls);

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
