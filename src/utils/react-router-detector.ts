import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";

export type RouterFileType = "jsx" | "object" | "data-router" | "unknown";

export type RouterFileInfo = {
  readonly filePath: string;
  readonly routerType: RouterFileType;
  readonly isRouter: boolean;
};

type RouterDetectorOptions = {
  readonly logger?: Logger;
};

/**
 * Common React Router import patterns to look for
 */
const ROUTER_IMPORT_PATTERNS = [
  "from 'react-router'",
  'from "react-router"',
  "from 'react-router-dom'",
  'from "react-router-dom"',
  "from '@tanstack/react-router'",
  'from "@tanstack/react-router"',
];

/**
 * Common Router component patterns to look for
 */
const ROUTER_COMPONENT_PATTERNS = [
  "<BrowserRouter",
  "<HashRouter",
  "<MemoryRouter",
  "<Router",
  "<Routes",
  "<Route",
  "createBrowserRouter",
  "createHashRouter",
  "createMemoryRouter",
  "createStaticRouter",
  "createRoutesFromElements",
  "createRoute",
  "RouterProvider",
  "defineRoutes",
  "new Router(",
];

/**
 * Check if a file contains React Router imports
 */
async function hasRouterImports(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return ROUTER_IMPORT_PATTERNS.some((pattern) => content.includes(pattern));
  } catch (error) {
    // File can't be read or doesn't exist
    return false;
  }
}

/**
 * Check if a file contains Router component usage
 */
async function hasRouterComponents(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return ROUTER_COMPONENT_PATTERNS.some((pattern) => content.includes(pattern));
  } catch (error) {
    // File can't be read or doesn't exist
    return false;
  }
}

/**
 * Determine the router type from file content
 */
async function determineRouterType(filePath: string): Promise<RouterFileType> {
  try {
    const content = await fs.readFile(filePath, "utf8");

    // Check for JSX route definitions (<Route> components)
    if (content.includes("<Route") || content.includes("<Routes")) {
      return "jsx";
    }

    // Check for object-based route definitions (createBrowserRouter, etc)
    if (
      content.includes("createBrowserRouter") ||
      content.includes("createHashRouter") ||
      content.includes("createMemoryRouter") ||
      content.includes("createStaticRouter") ||
      content.includes("createRoutesFromElements")
    ) {
      return "object";
    }

    // Check for data router API (newer React Router v6+)
    if (
      content.includes("new Router(") ||
      content.includes("createRoute") ||
      content.includes("defineRoutes") ||
      content.includes("routeTree")
    ) {
      return "data-router";
    }

    return "unknown";
  } catch (error) {
    return "unknown";
  }
}

/**
 * Check if a file is a potential React Router definition file
 */
export async function detectRouterFile(
  filePath: string,
  options: RouterDetectorOptions = {}
): Promise<RouterFileInfo> {
  const logger = options.logger || createLogger();

  logger.debug(`Checking file for router definitions: ${filePath}`);

  // Check if file has router imports
  const hasImports = await hasRouterImports(filePath);

  // If no router imports, not a router file
  if (!hasImports) {
    logger.debug(`No React Router imports found in: ${filePath}`);
    return { filePath, isRouter: false, routerType: "unknown" };
  }

  // Check if file has router components
  const hasComponents = await hasRouterComponents(filePath);

  // If no router components, likely not a router definition file
  if (!hasComponents) {
    logger.debug(`No React Router components found in: ${filePath}`);
    return { filePath, isRouter: false, routerType: "unknown" };
  }

  // Determine the router type
  const routerType = await determineRouterType(filePath);

  logger.debug(`Found React Router file: ${filePath} (type: ${routerType})`);

  return { filePath, isRouter: true, routerType };
}

/**
 * Find React Router definition files in a list of files
 */
export async function findRouterDefinitionFiles(
  filePaths: string[],
  options: RouterDetectorOptions = {}
): Promise<RouterFileInfo[]> {
  const logger = options.logger || createLogger();

  logger.info(`Searching for React Router definition files in ${filePaths.length} files...`);

  const results = await Promise.all(
    filePaths.map((filePath) => detectRouterFile(filePath, { logger }))
  );

  // Filter to only include actual router files
  const routerFiles = results.filter((result) => result.isRouter);

  logger.info(`Found ${routerFiles.length} React Router definition files`);

  return routerFiles;
}
