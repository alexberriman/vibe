import path from "node:path";
import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";
import { scanDirectory } from "./directory-scanner.js";
import { detectNextjsSpecialFile, type NextjsFileType } from "./nextjs-special-file-detector.js";
import { extractRouteMetadata, type RouteMetadata } from "./route-metadata-extractor.js";

/**
 * Represents a route in the Next.js Pages Router
 */
export type NextjsPagesRoute = {
  readonly relativePath: string; // Path relative to pages directory
  readonly absolutePath: string; // Absolute path to the file
  readonly routePath: string; // Converted path for URL routing
  readonly segments: string[]; // Route segments
  readonly isApiRoute: boolean; // Is this an API route? (in /api directory)
  readonly isDynamic: boolean; // Is this a dynamic route? (folder or file in brackets)
  readonly isCatchAll: boolean; // Is this a catch-all route? (with [...])
  readonly isOptionalCatchAll: boolean; // Is this an optional catch-all route? (with [[...]])
  readonly fileType: NextjsFileType; // Type of file
  readonly isSpecialFile: boolean; // Is this a special Next.js file?
  readonly isClientComponent: boolean; // Is this a client component?
  readonly isServerComponent: boolean; // Is this a server component?
  readonly metadata?: RouteMetadata; // Extracted metadata from the route file
};

/**
 * Options for the Pages Router analyzer
 */
type PagesRouterAnalyzerOptions = {
  readonly pagesDirectory?: string;
  readonly logger?: Logger;
};

/**
 * Check if a file is an index file
 * In Next.js Pages Router, index files become the root of their directory
 * This is used internally by filePathToRoutePath
 * @internal
 */
function _isIndexFile(filePath: string): boolean {
  const filename = path.basename(filePath);
  return (
    filename === "index.js" ||
    filename === "index.jsx" ||
    filename === "index.ts" ||
    filename === "index.tsx"
  );
}

/**
 * Check if a file is an API route
 */
function isApiRoute(filePath: string, pagesDir: string): boolean {
  const relativePath = path.relative(pagesDir, filePath);
  const segments = relativePath.split(path.sep);
  return segments.length > 0 && segments[0] === "api";
}

/**
 * Check if a segment (folder or file name) is a dynamic route
 */
function isDynamicSegment(segment: string): boolean {
  // Remove file extension first for file segments
  const nameWithoutExtension = segment.replace(/\.[^/.]+$/, "");
  return nameWithoutExtension.startsWith("[") && nameWithoutExtension.endsWith("]");
}

/**
 * Check if a segment is a catch-all route
 */
function isCatchAllSegment(segment: string): boolean {
  // Remove file extension first for file segments
  const nameWithoutExtension = segment.replace(/\.[^/.]+$/, "");
  return nameWithoutExtension.startsWith("[...") && nameWithoutExtension.endsWith("]");
}

/**
 * Check if a segment is an optional catch-all route
 */
function isOptionalCatchAllSegment(segment: string): boolean {
  // Remove file extension first for file segments
  const nameWithoutExtension = segment.replace(/\.[^/.]+$/, "");
  return nameWithoutExtension.startsWith("[[...") && nameWithoutExtension.endsWith("]]");
}

/**
 * Convert a file path to a route path
 */
function filePathToRoutePath(filePath: string, pagesDir: string): string {
  // Get the relative path from the pages directory
  const relativePath = path.relative(pagesDir, filePath);

  // Remove file extension and convert to route path format
  let routePath = relativePath.replace(/\.[^/.]+$/, "");

  // Handle index files which map to their parent directory
  if (routePath.endsWith("/index") || routePath === "index") {
    routePath = routePath.replace(/\/index$|^index$/, "");
  }

  // Note: We use this logic rather than calling _isIndexFile directly because
  // we need to work with the file path after extension removal

  // Split into segments
  const segments = routePath.split(path.sep);

  // Process segments for special cases like dynamic routes
  const processedSegments = segments.map((segment) => {
    if (isOptionalCatchAllSegment(segment)) {
      // Keep as is for route path representation
      return segment;
    }

    if (isCatchAllSegment(segment)) {
      // Keep as is for route path representation
      return segment;
    }

    if (isDynamicSegment(segment)) {
      // Keep as is for route path representation
      return segment;
    }

    return segment;
  });

  // Build the final route path with leading slash
  const finalPath = "/" + processedSegments.join("/");
  if (finalPath === "/") {
    return finalPath;
  }

  return finalPath;
}

/**
 * Parse a file path to extract route information
 */
async function parseFilePath(
  filePath: string,
  pagesDir: string,
  logger: Logger
): Promise<NextjsPagesRoute> {
  // Calculate the path relative to the pages directory
  const relativePath = path.relative(pagesDir, filePath);

  // Get route path
  const routePath = filePathToRoutePath(filePath, pagesDir);

  // Split the path into segments
  const segments = relativePath.split(path.sep);

  // Check for route characteristics
  const isApi = isApiRoute(filePath, pagesDir);
  let isDynamic = false;
  let isCatchAll = false;
  let isOptionalCatchAll = false;

  // Check segments for dynamic routes
  for (const segment of segments) {
    if (isOptionalCatchAllSegment(segment)) {
      isDynamic = true;
      isOptionalCatchAll = true;
      break;
    } else if (isCatchAllSegment(segment)) {
      isDynamic = true;
      isCatchAll = true;
      break;
    } else if (isDynamicSegment(segment)) {
      isDynamic = true;
    }
  }

  // Use the special file detector to get enhanced file information
  const fileInfo = detectNextjsSpecialFile(filePath);

  // Determine file type for the Pages Router
  let fileType = fileInfo.fileType;

  // All API routes should be categorized as "api" type
  if (isApi) {
    fileType = "api";
  } else if (fileType === "other") {
    // In Pages Router, any non-API file that's not a special file is a page
    fileType = "page";
  }

  // Extract metadata from the route file
  let metadata;
  try {
    metadata = await extractRouteMetadata({ filePath, logger });
  } catch (error) {
    logger.warn(
      `Failed to extract metadata from ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return {
    relativePath,
    absolutePath: filePath,
    routePath,
    segments,
    isApiRoute: isApi,
    isDynamic,
    isCatchAll,
    isOptionalCatchAll,
    fileType,
    isSpecialFile: fileInfo.isSpecialFile,
    isClientComponent: fileInfo.isClientComponent,
    isServerComponent: fileInfo.isServerComponent,
    metadata,
  };
}

/**
 * Analyze the Next.js Pages Router directory structure to find routes
 */
export async function analyzePagesRouter({
  pagesDirectory,
  logger = createLogger(),
}: PagesRouterAnalyzerOptions): Promise<NextjsPagesRoute[]> {
  if (!pagesDirectory) {
    throw new Error("Pages directory is required");
  }

  // Verify the pages directory exists
  try {
    const stats = await fs.stat(pagesDirectory);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${pagesDirectory}`);
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Pages directory does not exist: ${pagesDirectory}`);
    }
    throw error;
  }

  logger.info(`Analyzing Next.js Pages Router structure in: ${pagesDirectory}`);

  // Define file extensions to look for
  const fileExtensions = [".js", ".jsx", ".ts", ".tsx"];

  // Scan the pages directory for files
  const files = await scanDirectory({
    basePath: pagesDirectory,
    fileExtensions,
    logger,
  });

  // Filter out non-route files using our specialized file detector
  const routeFiles = files.filter((file) => {
    // Get enhanced file information
    const fileInfo = detectNextjsSpecialFile(file);

    // If it's a recognized special file, keep it
    if (fileInfo.isSpecialFile) {
      return true;
    }

    const filename = path.basename(file);
    // Exclude Next.js special files that start with underscore
    // These are configuration files, not routes
    const isConfigFile =
      filename.startsWith("_app.") ||
      filename.startsWith("_document.") ||
      filename.startsWith("_error.") ||
      filename.startsWith("_middleware.");

    // In Pages Router, all files except config files become routes
    return !isConfigFile;
  });

  logger.info(`Found ${routeFiles.length} route files in the Pages Router`);

  // Parse each file to extract route information
  const routes = await Promise.all(
    routeFiles.map((file) => parseFilePath(file, pagesDirectory, logger))
  );

  // Log enhanced summary information with special file detection
  const pageRoutes = routes.filter((route) => route.fileType === "page");
  const apiRoutes = routes.filter((route) => route.fileType === "api");
  const dynamicRoutes = routes.filter((route) => route.isDynamic);
  const layoutRoutes = routes.filter((route) => route.fileType === "layout");
  const loadingRoutes = routes.filter((route) => route.fileType === "loading");
  const errorRoutes = routes.filter((route) => route.fileType === "error");
  const notFoundRoutes = routes.filter((route) => route.fileType === "not-found");
  const templateRoutes = routes.filter((route) => route.fileType === "template");
  const specialFiles = routes.filter((route) => route.isSpecialFile);
  const clientComponents = routes.filter((route) => route.isClientComponent);
  const serverComponents = routes.filter((route) => route.isServerComponent);

  logger.info(`Found ${pageRoutes.length} page routes`);
  logger.info(`Found ${apiRoutes.length} API routes`);
  logger.info(`Found ${dynamicRoutes.length} dynamic routes`);
  logger.info(`Found ${specialFiles.length} special Next.js files`);

  // Log additional special file types if any are found
  if (layoutRoutes.length > 0) logger.info(`Found ${layoutRoutes.length} layout files`);
  if (loadingRoutes.length > 0) logger.info(`Found ${loadingRoutes.length} loading files`);
  if (errorRoutes.length > 0) logger.info(`Found ${errorRoutes.length} error handling files`);
  if (notFoundRoutes.length > 0) logger.info(`Found ${notFoundRoutes.length} not-found files`);
  if (templateRoutes.length > 0) logger.info(`Found ${templateRoutes.length} template files`);
  if (clientComponents.length > 0)
    logger.info(`Found ${clientComponents.length} client components`);
  if (serverComponents.length > 0)
    logger.info(`Found ${serverComponents.length} server components`);

  return routes;
}
