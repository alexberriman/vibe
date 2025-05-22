import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "../logger.js";
import type { RouteInfo } from "./jsx-parser.js";

type ObjectParserOptions = {
  readonly logger?: Logger;
};

/**
 * Parse object-based routes from a file (createBrowserRouter, createHashRouter, etc.)
 */
export async function parseObjectRoutes(
  filePath: string,
  options: ObjectParserOptions = {}
): Promise<RouteInfo[]> {
  const logger = options.logger || createLogger();
  logger.debug(`Parsing object-based routes from file: ${filePath}`);

  try {
    const content = await fs.readFile(filePath, "utf8");

    // Find router creation calls with route objects
    const routes = findRouteObjectsDefinition(content, logger);

    logger.debug(`Found ${routes.length} top-level routes in ${filePath}`);
    return routes;
  } catch (error) {
    logger.error(`Failed to parse object routes from ${filePath}`);
    if (error instanceof Error) {
      logger.error(error.message);
    }
    return [];
  }
}

/**
 * Extract route objects from file content
 */
function findRouteObjectsDefinition(content: string, logger: Logger): RouteInfo[] {
  // Find router creation calls with array of route objects
  const routerCreationPatterns = [
    "createBrowserRouter\\(\\s*\\[",
    "createHashRouter\\(\\s*\\[",
    "createMemoryRouter\\(\\s*\\[",
    "createStaticRouter\\(\\s*\\[",
    "const\\s+routes\\s*=\\s*\\[",
    "let\\s+routes\\s*=\\s*\\[",
    "var\\s+routes\\s*=\\s*\\[",
    "export\\s+const\\s+routes\\s*=\\s*\\[",
    "export\\s+let\\s+routes\\s*=\\s*\\[",
    "export\\s+var\\s+routes\\s*=\\s*\\[",
    "export\\s+default\\s*\\[",
  ];

  // Try to find the beginning of route definitions
  let routesArray = "";
  let bracketCount = 0;
  let startIndex = -1;

  // Search for patterns that indicate route definitions
  for (const pattern of routerCreationPatterns) {
    const match = new RegExp(pattern, "g").exec(content);
    if (match) {
      startIndex = match.index + match[0].length - 1; // Position at the opening bracket
      break;
    }
  }

  // If no route definitions found, return empty array
  if (startIndex === -1) {
    logger.debug("No object-based route definitions found");
    return [];
  }

  // Extract the routes array, keeping track of brackets to find the closing bracket
  bracketCount = 1; // We start with one opening bracket
  let i = startIndex + 1;

  while (i < content.length && bracketCount > 0) {
    const char = content[i];
    if (char === "[") bracketCount++;
    if (char === "]") bracketCount--;

    // Only add to routesArray if we're still within the array
    if (bracketCount > 0 || char === "]") {
      routesArray += char;
    }

    i++;
  }

  // If we didn't find a matching closing bracket, return empty array
  if (bracketCount !== 0) {
    logger.debug("Could not find closing bracket for routes array");
    return [];
  }

  // Parse the routes from the extracted array
  return parseRoutesArray(routesArray, "", logger);
}

/**
 * Parse an array of route objects
 */
function parseRoutesArray(routesContent: string, parentPath: string, logger: Logger): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Split the content by objects at the top level
  // This is a simple approach that may not handle complex nested objects correctly
  // But it's a starting point that works for common cases
  const routeObjects = extractRouteObjects(routesContent);

  for (const routeObject of routeObjects) {
    try {
      const route = parseRouteObject(routeObject, parentPath, logger);
      if (route) {
        routes.push(route);
      }
    } catch (error) {
      logger.debug(
        `Failed to parse route object: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return routes;
}

/**
 * Extract individual route objects from an array of routes
 */
function extractRouteObjects(routesContent: string): string[] {
  const routeObjects: string[] = [];
  let currentObject = "";
  let braceCount = 0;
  let inObject = false;

  for (let i = 0; i < routesContent.length; i++) {
    const char = routesContent[i];

    if (char === "{") {
      braceCount++;
      if (braceCount === 1) {
        // Start of a new object
        inObject = true;
        currentObject = "{";
        continue;
      }
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        // End of current object
        currentObject += "}";
        routeObjects.push(currentObject);
        currentObject = "";
        inObject = false;
        continue;
      }
    }

    if (inObject) {
      currentObject += char;
    }
  }

  return routeObjects;
}

/**
 * Extract path from route object
 */
function extractPathFromRouteObject(routeObject: string): string {
  const pathPatterns = [/path\s*:\s*["']([^"']*)["']/, /path\s*:\s*`([^`]*)`/];

  for (const pattern of pathPatterns) {
    const match = routeObject.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return "";
}

/**
 * Check if route is an index route
 */
function isIndexRoute(routeObject: string): boolean {
  const indexMatch = routeObject.match(/index\s*:\s*(true|"true"|'true'|`true`|\{true\})/);
  return Boolean(indexMatch);
}

/**
 * Extract element from route object
 */
function extractElementFromRouteObject(routeObject: string): string | undefined {
  const elementPatterns = [/element\s*:\s*<([^>]+)>/, /element\s*:\s*\{?<([^>]+)>\}?/];

  for (const pattern of elementPatterns) {
    const match = routeObject.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extract children content from route object
 */
function extractChildrenContent(routeObject: string): string {
  const childrenMatch = routeObject.match(/children\s*:\s*\[/);
  if (!childrenMatch) {
    return "";
  }

  const childrenStartIndex = routeObject.indexOf("[", childrenMatch.index);
  let bracketCount = 1;
  let childrenContent = "";
  let i = childrenStartIndex + 1;

  while (i < routeObject.length && bracketCount > 0) {
    const char = routeObject[i];
    if (char === "[") bracketCount++;
    if (char === "]") bracketCount--;

    if (bracketCount > 0) {
      childrenContent += char;
    }

    i++;
  }

  return childrenContent;
}

/**
 * Check if path has dynamic segments
 */
function hasDynamicSegments(path: string): boolean {
  return path.includes(":") || path.includes("*");
}

/**
 * Parse a single route object and extract its properties
 */
function parseRouteObject(
  routeObject: string,
  parentPath: string,
  logger: Logger
): RouteInfo | null {
  // Create a route info object with default values
  const routeInfo: RouteInfo = {
    path: "",
    parentPath,
  };

  // Extract path property
  routeInfo.path = extractPathFromRouteObject(routeObject);

  // If no path was found, check for index route
  if (!routeInfo.path) {
    if (isIndexRoute(routeObject)) {
      routeInfo.index = true;
    } else {
      // Neither path nor index property was found
      return null;
    }
  }

  // If path is specified, make sure it's properly formatted with parent path
  if (routeInfo.path) {
    routeInfo.path = combineRoutePaths(parentPath, routeInfo.path);
    routeInfo.hasDynamicSegments = hasDynamicSegments(routeInfo.path);
  }

  // Extract element property
  const element = extractElementFromRouteObject(routeObject);
  if (element) {
    routeInfo.element = element;
  }

  // Check for children property
  const childrenContent = extractChildrenContent(routeObject);
  if (childrenContent) {
    const childParentPath = routeInfo.path || parentPath;
    routeInfo.children = parseRoutesArray(childrenContent, childParentPath, logger);
  }

  return routeInfo;
}

/**
 * Combine parent path with current path to create a full path
 */
function combineRoutePaths(parentPath: string, path: string): string {
  // If path starts with /, it's absolute
  if (path.startsWith("/")) {
    return path;
  }

  // If parent path is empty, just return the path
  if (!parentPath) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  // Combine paths, avoiding double slashes
  const normalizedParent = parentPath.endsWith("/") ? parentPath : `${parentPath}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return `${normalizedParent}${normalizedPath}`;
}
