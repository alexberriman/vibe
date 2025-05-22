import path from "node:path";
import fs from "node:fs/promises";
import { createLogger } from "./logger.js";
import type { Logger } from "pino";

export type MiddlewareInfo = {
  readonly exists: boolean;
  readonly filePath?: string;
  readonly matcher?: string[];
};

export type RewriteRule = {
  readonly source: string;
  readonly destination: string;
  readonly permanent?: boolean;
};

export type RedirectRule = {
  readonly source: string;
  readonly destination: string;
  readonly permanent?: boolean;
  readonly statusCode?: number;
};

export type NextjsMiddlewareResult = {
  readonly middleware: MiddlewareInfo;
  readonly rewrites: RewriteRule[];
  readonly redirects: RedirectRule[];
};

type NextjsMiddlewareDetectorOptions = {
  readonly basePath?: string;
  readonly logger?: Logger;
};

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Parse middleware matcher configuration from file content
 */
function parseMiddlewareMatcher(content: string, logger: Logger): string[] | undefined {
  const matcherMatch = content.match(/matcher\s*:\s*(\[.*?\]|['"`].*?['"`])/s);

  if (!matcherMatch || !matcherMatch[1]) {
    return undefined;
  }

  try {
    const matcherValue = matcherMatch[1].trim();
    if (matcherValue.startsWith("[") && matcherValue.endsWith("]")) {
      // Array format: ['/', '/about/:path*']
      return JSON.parse(matcherValue.replace(/'/g, '"'));
    }
    // String format: '/api/:path*'
    return [matcherValue.replace(/['"]/g, "")];
  } catch (error) {
    logger.warn(`Failed to parse middleware matcher: ${error}`);
    return undefined;
  }
}

/**
 * Process a single middleware file
 */
async function processMiddlewareFile(
  middlewarePath: string,
  logger: Logger
): Promise<MiddlewareInfo | null> {
  try {
    const content = await fs.readFile(middlewarePath, "utf-8");
    const matcher = parseMiddlewareMatcher(content, logger);

    return {
      exists: true,
      filePath: middlewarePath,
      matcher,
    };
  } catch (error) {
    logger.warn(`Failed to read middleware file ${middlewarePath}: ${error}`);
    return null;
  }
}

/**
 * Try to read and parse the middleware file
 */
async function detectMiddleware(basePath: string, logger: Logger): Promise<MiddlewareInfo> {
  const possiblePaths = [
    path.join(basePath, "middleware.ts"),
    path.join(basePath, "middleware.js"),
    path.join(basePath, "src", "middleware.ts"),
    path.join(basePath, "src", "middleware.js"),
  ];

  for (const middlewarePath of possiblePaths) {
    if (await fileExists(middlewarePath)) {
      logger.info(`Found middleware file: ${middlewarePath}`);

      const result = await processMiddlewareFile(middlewarePath, logger);
      if (result) {
        return result;
      }
    }
  }

  return { exists: false };
}

/**
 * Parse rewrites from config file content
 */
function parseRewrites(content: string): RewriteRule[] {
  const rewrites: RewriteRule[] = [];
  const rewritesMatch = content.match(/rewrites\s*\(\)\s*\{\s*return\s*\[(.*?)\]/s);

  if (rewritesMatch && rewritesMatch[1]) {
    const rewritesContent = rewritesMatch[1];
    const rewriteObjectMatches = rewritesContent.matchAll(
      /\{\s*source\s*:\s*['"`]([^'"]+)['"`]\s*,\s*destination\s*:\s*['"`]([^'"]+)['"`]/g
    );

    for (const match of rewriteObjectMatches) {
      rewrites.push({
        source: match[1] || "",
        destination: match[2] || "",
      });
    }
  }

  return rewrites;
}

/**
 * Parse redirects from config file content
 */
function parseRedirects(content: string): RedirectRule[] {
  const redirects: RedirectRule[] = [];
  const redirectsMatch = content.match(/redirects\s*\(\)\s*\{\s*return\s*\[(.*?)\]/s);

  if (redirectsMatch && redirectsMatch[1]) {
    const redirectsContent = redirectsMatch[1];
    const redirectObjectMatches = redirectsContent.matchAll(
      /\{\s*source\s*:\s*['"`]([^'"]+)['"`]\s*,\s*destination\s*:\s*['"`]([^'"]+)['"`](?:\s*,\s*permanent\s*:\s*(true|false))?(?:\s*,\s*statusCode\s*:\s*(\d+))?/g
    );

    for (const match of redirectObjectMatches) {
      redirects.push({
        source: match[1] || "",
        destination: match[2] || "",
        permanent: match[3] === "true",
        statusCode: match[4] ? Number(match[4]) : undefined,
      });
    }
  }

  return redirects;
}

/**
 * Process a config file for rewrites and redirects
 */
async function processConfigFile(
  configPath: string,
  logger: Logger
): Promise<{ rewrites: RewriteRule[]; redirects: RedirectRule[] } | null> {
  try {
    const content = await fs.readFile(configPath, "utf-8");
    const rewrites = parseRewrites(content);
    const redirects = parseRedirects(content);

    logger.info(`Found ${rewrites.length} rewrites and ${redirects.length} redirects in config`);
    return { rewrites, redirects };
  } catch (error) {
    logger.warn(`Failed to read Next.js config file ${configPath}: ${error}`);
    return null;
  }
}

/**
 * Try to read and parse next.config.js for rewrites and redirects
 */
async function detectRewrites(
  basePath: string,
  logger: Logger
): Promise<{ rewrites: RewriteRule[]; redirects: RedirectRule[] }> {
  const possibleConfigPaths = [
    path.join(basePath, "next.config.js"),
    path.join(basePath, "next.config.mjs"),
    path.join(basePath, "next.config.ts"),
  ];

  for (const configPath of possibleConfigPaths) {
    if (await fileExists(configPath)) {
      logger.info(`Found Next.js config file: ${configPath}`);

      const result = await processConfigFile(configPath, logger);
      if (result) {
        return result;
      }
    }
  }

  return { rewrites: [], redirects: [] };
}

/**
 * Detect Next.js middleware and rewrites configuration
 */
export async function detectNextjsMiddleware(
  options: NextjsMiddlewareDetectorOptions = {}
): Promise<NextjsMiddlewareResult> {
  const basePath = path.resolve(options.basePath || ".");
  const logger = options.logger || createLogger();

  logger.info(`Detecting Next.js middleware and rewrites in: ${basePath}`);

  // Detect middleware
  const middleware = await detectMiddleware(basePath, logger);

  // Detect rewrites and redirects
  const { rewrites, redirects } = await detectRewrites(basePath, logger);

  return {
    middleware,
    rewrites,
    redirects,
  };
}
