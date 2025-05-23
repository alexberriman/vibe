import { Command } from "commander";
import fs from "node:fs/promises";
import { createLogger } from "../../utils/logger.js";
import {
  detectNextjsStructure,
  type NextjsStructure,
} from "../../utils/nextjs-structure-detector.js";
import { detectNextjsConfig } from "../../utils/nextjs-config-detector.js";
import { analyzeAppRouter, type NextjsAppRoute } from "../../utils/nextjs-app-router-analyzer.js";
import {
  analyzePagesRouter,
  type NextjsPagesRoute,
} from "../../utils/nextjs-pages-router-analyzer.js";
import {
  detectNextjsMiddleware,
  type NextjsMiddlewareResult,
} from "../../utils/nextjs-middleware-detector.js";

type NextjsRoutesOptions = {
  readonly path?: string;
  readonly port?: number;
  readonly output?: string;
  readonly pretty?: boolean;
  readonly filter?: string;
  readonly type?: string;
};

import { type NextjsFileType } from "../../utils/nextjs-special-file-detector.js";
import { type RouteMetadata } from "../../utils/route-metadata-extractor.js";

/**
 * Represents a route in the Next.js application
 */
type NextjsRouteInfo = {
  readonly path: string;
  readonly url: string;
  readonly type: "page" | "api";
  readonly fileType: NextjsFileType;
  readonly hasDynamicSegments: boolean;
  readonly source: "app" | "pages";
  readonly isClientComponent?: boolean;
  readonly isServerComponent?: boolean;
  readonly metadata?: RouteMetadata;
};

/**
 * Convert an app router route to a route info object
 */
function convertAppRouteToRouteInfo(appRoute: NextjsAppRoute, baseUrl: string): NextjsRouteInfo {
  // Determine the route type
  const routeType = appRoute.isRoute ? "api" : "page";

  // Build the full URL
  const url = `${baseUrl}${appRoute.routePath}`;

  return {
    path: appRoute.routePath,
    url,
    type: routeType,
    fileType: appRoute.fileType,
    hasDynamicSegments: appRoute.isDynamic,
    source: "app",
    isClientComponent: appRoute.isClientComponent,
    isServerComponent: appRoute.isServerComponent,
    metadata: appRoute.metadata,
  };
}

/**
 * Convert a pages router route to a route info object
 */
function convertPagesRouteToRouteInfo(
  pagesRoute: NextjsPagesRoute,
  baseUrl: string
): NextjsRouteInfo {
  // Determine the route type
  const routeType = pagesRoute.isApiRoute ? "api" : "page";

  // Build the full URL
  const url = `${baseUrl}${pagesRoute.routePath}`;

  return {
    path: pagesRoute.routePath,
    url,
    type: routeType,
    fileType: pagesRoute.fileType,
    hasDynamicSegments: pagesRoute.isDynamic,
    source: "pages",
    isClientComponent: pagesRoute.isClientComponent,
    isServerComponent: pagesRoute.isServerComponent,
    metadata: pagesRoute.metadata,
  };
}

/**
 * Filter routes based on options
 */
function filterRoutes(
  routes: NextjsRouteInfo[],
  options: { filter?: string; type?: string }
): NextjsRouteInfo[] {
  let filteredRoutes = [...routes];

  // Filter by route type if specified
  if (options.type && options.type !== "all") {
    filteredRoutes = filteredRoutes.filter((route) => route.type === options.type);
  }

  // Filter by pattern if specified
  if (options.filter) {
    const pattern = new RegExp(options.filter, "i");
    filteredRoutes = filteredRoutes.filter((route) => pattern.test(route.path));
  }

  return filteredRoutes;
}

/**
 * Scan a directory for Next.js routes
 */
async function scanNextjsProject(
  dirPath: string,
  logger = createLogger()
): Promise<{
  structure: NextjsStructure;
  port: number;
  appRoutes: NextjsAppRoute[];
  pagesRoutes: NextjsPagesRoute[];
  middleware: NextjsMiddlewareResult;
}> {
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

  // Detect Next.js port configuration
  const configResult = await detectNextjsConfig({
    basePath: dirPath,
    logger,
  });

  if (configResult.configFound) {
    logger.info(`Detected Next.js port ${configResult.port} from ${configResult.configSource}`);
  } else {
    logger.info(`Using default Next.js port: ${configResult.port}`);
  }

  // Initialize routes arrays
  let appRoutes: NextjsAppRoute[] = [];
  let pagesRoutes: NextjsPagesRoute[] = [];

  // If app router is detected, analyze it
  if (structure.hasAppRouter && structure.appDirectory) {
    logger.info(`Analyzing App Router directory: ${structure.appDirectory}`);
    appRoutes = await analyzeAppRouter({
      appDirectory: structure.appDirectory,
      logger,
    });
    logger.info(`Found ${appRoutes.length} routes in App Router`);
  }

  // If pages router is detected, analyze it
  if (structure.hasPagesRouter && structure.pagesDirectory) {
    logger.info(`Analyzing Pages Router directory: ${structure.pagesDirectory}`);
    pagesRoutes = await analyzePagesRouter({
      pagesDirectory: structure.pagesDirectory,
      logger,
    });
    logger.info(`Found ${pagesRoutes.length} routes in Pages Router`);
  }

  // Detect middleware and rewrites
  const middleware = await detectNextjsMiddleware({
    basePath: dirPath,
    logger,
  });

  return { structure, port: configResult.port, appRoutes, pagesRoutes, middleware };
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
    .option("-P, --port <port>", "Next.js development server port (overrides detected port)")
    .option("-o, --output <o>", "Output file path (default: print to console)")
    .option("--pretty", "Pretty print the JSON output", false)
    .option("-f, --filter <filter>", "Filter routes by pattern")
    .option("-t, --type <type>", "Filter by route type (page, api, all)", "all")
    .action(async (options: NextjsRoutesOptions) => {
      try {
        const dirPath = options.path || ".";

        // Scan the Next.js project directory and detect structure and configuration
        const { structure, port, appRoutes, pagesRoutes, middleware } = await scanNextjsProject(
          dirPath,
          logger
        );

        // Use the detected port, unless overridden by command line option
        const resultPort = options.port ? Number(options.port) : port;

        // Build the base URL for the routes
        const baseUrl = `http://localhost:${resultPort}`;

        // Convert app routes to route info objects
        const appRouteInfos = appRoutes.map((route) => convertAppRouteToRouteInfo(route, baseUrl));

        // Convert pages routes to route info objects
        const pagesRouteInfos = pagesRoutes.map((route) =>
          convertPagesRouteToRouteInfo(route, baseUrl)
        );

        // Combine all routes
        const routes: NextjsRouteInfo[] = [...appRouteInfos, ...pagesRouteInfos];

        // Filter routes based on options
        const filteredRoutes = filterRoutes(routes, {
          filter: options.filter,
          type: options.type,
        });

        // Create the result object
        const result = {
          scannedDirectory: dirPath,
          baseUrl,
          routesFound: filteredRoutes.length,
          totalRoutesFound: routes.length,
          structure: {
            hasAppRouter: structure.hasAppRouter,
            hasPagesRouter: structure.hasPagesRouter,
            appDirectory: structure.appDirectory || null,
            pagesDirectory: structure.pagesDirectory || null,
          },
          middleware: {
            exists: middleware.middleware.exists,
            filePath: middleware.middleware.filePath || null,
            matcher: middleware.middleware.matcher || null,
            rewrites: middleware.rewrites,
            redirects: middleware.redirects,
          },
          routes: filteredRoutes,
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
