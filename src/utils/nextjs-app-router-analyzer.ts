import path from "node:path";
import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";
import { scanDirectory } from "./directory-scanner.js";
import {
  detectNextjsSpecialFile,
  filterNextjsSpecialFiles,
  type NextjsFileType,
} from "./nextjs-special-file-detector.js";

/**
 * Represents a route in the Next.js App Router
 */
export type NextjsAppRoute = {
  readonly relativePath: string; // Path relative to app directory
  readonly absolutePath: string; // Absolute path to the file
  readonly routePath: string; // Converted path for URL routing
  readonly segments: string[]; // Route segments
  readonly isPage: boolean; // Is this a page.js/tsx file?
  readonly isLayout: boolean; // Is this a layout.js/tsx file?
  readonly isRoute: boolean; // Is this a route.js/tsx file? (API route)
  readonly isRouteGroup: boolean; // Is this in a route group? (folder in parentheses)
  readonly isParallelRoute: boolean; // Is this in a parallel route? (folder with @ prefix)
  readonly isDynamic: boolean; // Is this a dynamic route? (folder in brackets)
  readonly isCatchAll: boolean; // Is this a catch-all route? (folder with [...])
  readonly isOptionalCatchAll: boolean; // Is this an optional catch-all route? (folder with [[...]])
  readonly fileType: NextjsFileType; // Type of file
  readonly isClientComponent: boolean; // Is this a client component? (has "use client" directive)
  readonly isServerComponent: boolean; // Is this a server component? (default in Next.js App Router)
};

/**
 * Options for the App Router analyzer
 */
type AppRouterAnalyzerOptions = {
  readonly appDirectory?: string;
  readonly logger?: Logger;
};

/**
 * Check if a file path is for a specific file type
 * @deprecated Use detectNextjsSpecialFile instead
 */
function isFileType(filePath: string, fileType: string): boolean {
  const fileInfo = detectNextjsSpecialFile(filePath);
  return fileInfo.fileType === fileType;
}

/**
 * Check if a folder name represents a route group (folder in parentheses)
 */
function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/**
 * Check if a folder name represents a parallel route (folder with @ prefix)
 */
function isParallelRoute(segment: string): boolean {
  return segment.startsWith("@");
}

/**
 * Check if a folder name represents a dynamic route (folder in square brackets)
 */
function isDynamicRoute(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

/**
 * Check if a folder name represents a catch-all route (folder with [...])
 */
function isCatchAllRoute(segment: string): boolean {
  return segment.startsWith("[...") && segment.endsWith("]");
}

/**
 * Check if a folder name represents an optional catch-all route (folder with [[...]])
 */
function isOptionalCatchAllRoute(segment: string): boolean {
  return segment.startsWith("[[...") && segment.endsWith("]]");
}

/**
 * Parse a file path to extract route information
 */
function parseFilePath(filePath: string, appDirectory: string): NextjsAppRoute {
  // Calculate the path relative to the app directory
  const relativePath = path.relative(appDirectory, filePath);

  // Split the path into segments
  const segments = relativePath.split(path.sep);

  // Detect special file type
  const fileInfo = detectNextjsSpecialFile(filePath);

  // Check the file type for backwards compatibility
  const isPage = fileInfo.fileType === "page";
  const isLayout = fileInfo.fileType === "layout";
  const isRoute = fileInfo.fileType === "route";

  // Process the directory segments to build the route path
  // Extract only the directory parts, exclude the file name
  const dirSegments = segments.slice(0, segments.length - 1);

  // Check for special route characteristics
  let isDynamic = false;
  let isCatchAll = false;
  let isOptionalCatchAll = false;
  let isRouteGroupFound = false;
  let isParallelRouteFound = false;

  // Convert segments to URL path format, handling special route types
  const routePathSegments = dirSegments
    .map((segment) => {
      // Check for special route types
      if (isRouteGroup(segment)) {
        isRouteGroupFound = true;
        // Route groups don't appear in the URL path
        return null;
      }

      if (isParallelRoute(segment)) {
        isParallelRouteFound = true;
        // Parallel routes don't appear in the URL path
        return null;
      }

      if (isOptionalCatchAllRoute(segment)) {
        isDynamic = true;
        isOptionalCatchAll = true;
        // Extract the parameter name from [[...paramName]]
        const paramName = segment.slice(5, -2);
        return `[[...${paramName}]]`;
      }

      if (isCatchAllRoute(segment)) {
        isDynamic = true;
        isCatchAll = true;
        // Extract the parameter name from [...paramName]
        const paramName = segment.slice(4, -1);
        return `[...${paramName}]`;
      }

      if (isDynamicRoute(segment)) {
        isDynamic = true;
        // Extract the parameter name from [paramName]
        const paramName = segment.slice(1, -1);
        return `[${paramName}]`;
      }

      // Regular route segment
      return segment;
    })
    .filter(Boolean) as string[]; // Remove null values and ensure string type

  // Build the final route path
  let routePath = "/";
  if (routePathSegments.length > 0) {
    routePath = `/${routePathSegments.join("/")}`;
  }

  return {
    relativePath,
    absolutePath: filePath,
    routePath,
    segments,
    isPage,
    isLayout,
    isRoute,
    isRouteGroup: isRouteGroupFound,
    isParallelRoute: isParallelRouteFound,
    isDynamic,
    isCatchAll,
    isOptionalCatchAll,
    fileType: fileInfo.fileType,
    isClientComponent: fileInfo.isClientComponent,
    isServerComponent: fileInfo.isServerComponent,
  };
}

/**
 * Analyze the Next.js App Router directory structure to find routes
 */
export async function analyzeAppRouter({
  appDirectory,
  logger = createLogger(),
}: AppRouterAnalyzerOptions): Promise<NextjsAppRoute[]> {
  if (!appDirectory) {
    throw new Error("App directory is required");
  }

  // Verify the app directory exists
  try {
    const stats = await fs.stat(appDirectory);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${appDirectory}`);
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`App directory does not exist: ${appDirectory}`);
    }
    throw error;
  }

  logger.info(`Analyzing Next.js App Router structure in: ${appDirectory}`);

  // Define file extensions to look for
  const fileExtensions = [".js", ".jsx", ".ts", ".tsx"];

  // Scan the app directory for files
  const files = await scanDirectory({
    basePath: appDirectory,
    fileExtensions,
    logger,
  });

  // Filter for relevant route files using the special file detector
  const routeFiles = files.filter((file) => {
    const fileInfo = detectNextjsSpecialFile(file);
    return [
      "page",
      "layout",
      "route",
      "loading",
      "not-found",
      "error",
      "template",
      "default",
    ].includes(fileInfo.fileType);
  });

  logger.info(`Found ${routeFiles.length} route files in the App Router`);

  // Parse each file to extract route information
  const routes = routeFiles.map((file) => parseFilePath(file, appDirectory));

  // Log summary information with enhanced file type detection
  const pageRoutes = routes.filter((route) => route.isPage);
  const apiRoutes = routes.filter((route) => route.isRoute);
  const dynamicRoutes = routes.filter((route) => route.isDynamic);
  const layoutRoutes = routes.filter((route) => route.isLayout);
  const loadingRoutes = routes.filter((route) => route.fileType === "loading");
  const errorRoutes = routes.filter((route) => route.fileType === "error");
  const notFoundRoutes = routes.filter((route) => route.fileType === "not-found");
  const templateRoutes = routes.filter((route) => route.fileType === "template");
  const defaultRoutes = routes.filter((route) => route.fileType === "default");
  const clientComponents = routes.filter((route) => route.isClientComponent);
  const serverComponents = routes.filter((route) => route.isServerComponent);

  logger.info(`Found ${pageRoutes.length} page routes`);
  logger.info(`Found ${apiRoutes.length} API routes`);
  logger.info(`Found ${layoutRoutes.length} layout files`);
  logger.info(`Found ${loadingRoutes.length} loading files`);
  logger.info(`Found ${errorRoutes.length} error handling files`);
  logger.info(`Found ${notFoundRoutes.length} not-found files`);
  logger.info(`Found ${templateRoutes.length} template files`);
  logger.info(`Found ${defaultRoutes.length} default files`);
  logger.info(`Found ${dynamicRoutes.length} dynamic routes`);
  logger.info(`Found ${clientComponents.length} client components`);
  logger.info(`Found ${serverComponents.length} server components`);

  return routes;
}
