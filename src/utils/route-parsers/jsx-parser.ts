import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "../logger.js";

// Using an interface to allow property assignment in the implementation
export interface RouteInfo {
  path: string;
  element?: string;
  parentPath?: string;
  children?: RouteInfo[];
  index?: boolean;
  hasDynamicSegments?: boolean;
}

type JSXParserOptions = {
  readonly logger?: Logger;
};

/**
 * Parse JSX-style routes from a file
 */
export async function parseJSXRoutes(
  filePath: string,
  options: JSXParserOptions = {}
): Promise<RouteInfo[]> {
  const logger = options.logger || createLogger();
  logger.debug(`Parsing JSX routes from file: ${filePath}`);

  try {
    const content = await fs.readFile(filePath, "utf8");

    // Find all top-level Route elements within Routes
    const routes = extractTopLevelRoutes(content, logger);

    logger.debug(`Found ${routes.length} top-level routes in ${filePath}`);
    return routes;
  } catch (error) {
    logger.error(`Failed to parse JSX routes from ${filePath}`);
    if (error instanceof Error) {
      logger.error(error.message);
    }
    return [];
  }
}

/**
 * Extract top-level routes from JSX content
 */
function extractTopLevelRoutes(content: string, logger: Logger): RouteInfo[] {
  // Simple approach for tests - directly extract route patterns
  const routes: RouteInfo[] = [];

  // Match standalone Route elements first
  const selfClosingRoutes = content.match(/<Route\s+[^>]*?\/>/g) || [];

  // Process each self-closing route
  for (const route of selfClosingRoutes) {
    const routeInfo = extractRouteAttributes(route, "");
    if (routeInfo.path || routeInfo.index) {
      routes.push(routeInfo);
    }
  }

  // Match opening/closing Route pairs
  const routeRegex = /<Route\s+[^>]*?>[\s\S]*?<\/Route>/g;
  const openingRoutes = content.match(routeRegex) || [];

  // Process each opening/closing route
  for (const route of openingRoutes) {
    const routeInfo = processRouteWithChildren(route, "", logger);
    routes.push(routeInfo);
  }

  return routes;
}

/**
 * Extract child content from a route element
 */
function extractChildContent(routeElement: string): string {
  return routeElement
    .replace(/<Route\s+[^>]*?>/, "")
    .replace(/<\/Route>$/, "")
    .trim();
}

/**
 * Process self-closing child route elements
 */
function processSelfClosingChildren(
  selfClosingChildren: string[],
  childParentPath: string
): RouteInfo[] {
  const childRoutes: RouteInfo[] = [];

  for (const child of selfClosingChildren) {
    const childRouteInfo = extractRouteAttributes(child, childParentPath);
    if (childRouteInfo.path || childRouteInfo.index) {
      childRoutes.push(childRouteInfo);
    }
  }

  return childRoutes;
}

/**
 * Process opening/closing child route elements
 */
function processOpeningClosingChildren(
  openingChildren: string[],
  childParentPath: string,
  logger: Logger
): RouteInfo[] {
  const childRoutes: RouteInfo[] = [];

  for (const child of openingChildren) {
    const childRouteInfo = processRouteWithChildren(child, childParentPath, logger);
    childRoutes.push(childRouteInfo);
  }

  return childRoutes;
}

/**
 * Process child routes from content
 */
function processChildRoutes(
  childContent: string,
  routeInfo: RouteInfo,
  parentPath: string,
  logger: Logger
): void {
  const selfClosingChildren = childContent.match(/<Route\s+[^>]*?\/>/g) || [];
  const openingChildren = childContent.match(/<Route\s+[^>]*?>[\s\S]*?<\/Route>/g) || [];

  if (selfClosingChildren.length > 0 || openingChildren.length > 0) {
    const childParentPath = routeInfo.path || parentPath;

    const selfClosingRoutes = processSelfClosingChildren(selfClosingChildren, childParentPath);
    const openingClosingRoutes = processOpeningClosingChildren(
      openingChildren,
      childParentPath,
      logger
    );

    const allChildRoutes = [...selfClosingRoutes, ...openingClosingRoutes];

    if (allChildRoutes.length > 0) {
      routeInfo.children = allChildRoutes;
    }
  }
}

/**
 * Process a route element that may contain children
 */
function processRouteWithChildren(
  routeElement: string,
  parentPath: string,
  logger: Logger
): RouteInfo {
  // Extract the attributes from the opening tag
  const openingTagMatch = routeElement.match(/<Route\s+([^>]*?)>/);
  const attributes = openingTagMatch ? openingTagMatch[1] : "";

  // Create the route info
  const routeInfo = extractRouteAttributes(`<Route ${attributes}>`, parentPath);

  // Check for child routes
  const childContent = extractChildContent(routeElement);

  if (childContent) {
    processChildRoutes(childContent, routeInfo, parentPath, logger);
  }

  return routeInfo;
}

/**
 * Extract attributes from a <Route> element
 */
function extractRouteAttributes(element: string, parentPath: string): RouteInfo {
  const routeInfo: RouteInfo = {
    path: "",
    parentPath,
  };

  // Extract path attribute, handling different formats:
  // path="value", path='value', path={value}
  const pathMatchDoubleQuotes = element.match(/path\s*=\s*"([^"]*)"/);
  const pathMatchSingleQuotes = element.match(/path\s*=\s*'([^']*)'/);
  const pathMatchBraces = element.match(/path\s*=\s*\{(?:['"]([^'"]*)['"]*|([^{}]*))\}/);

  if (pathMatchDoubleQuotes) {
    routeInfo.path = pathMatchDoubleQuotes[1].trim();
  } else if (pathMatchSingleQuotes) {
    routeInfo.path = pathMatchSingleQuotes[1].trim();
  } else if (pathMatchBraces) {
    routeInfo.path = (pathMatchBraces[1] || pathMatchBraces[2] || "").trim();
  }

  // Check for dynamic segments like :id or *splat
  if (routeInfo.path && (routeInfo.path.includes(":") || routeInfo.path.includes("*"))) {
    routeInfo.hasDynamicSegments = true;
  }

  // Check for index route
  if (
    element.includes(" index") ||
    element.includes(" index=") ||
    /index\s*=\s*(?:true|\{true\})/.test(element)
  ) {
    routeInfo.index = true;
  }

  // Extract element attribute if present
  const elementMatch = element.match(/element\s*=\s*\{(?:<([^>]+)>|([^{}]*))\}/);
  if (elementMatch) {
    routeInfo.element = (elementMatch[1] || elementMatch[2] || "").trim();
  }

  // If path is specified, make sure it's properly formatted with parent path
  if (routeInfo.path) {
    routeInfo.path = combineRoutePaths(parentPath, routeInfo.path);
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
