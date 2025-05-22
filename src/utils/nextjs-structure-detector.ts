import path from "node:path";
import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";

export type NextjsStructure = {
  hasAppRouter: boolean;
  hasPagesRouter: boolean;
  appDirectory?: string;
  pagesDirectory?: string;
};

type NextjsStructureDetectorOptions = {
  readonly basePath?: string;
  readonly logger?: Logger;
};

/**
 * Validate that a directory exists and is a directory
 */
async function validateDirectory(dirPath: string): Promise<void> {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }
    throw error;
  }
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Find the first existing directory from a list of candidate paths
 */
async function findFirstExistingDirectory(
  dirPaths: string[],
  logger: Logger
): Promise<string | undefined> {
  for (const dir of dirPaths) {
    if (await directoryExists(dir)) {
      logger.debug(`Found directory: ${dir}`);
      return dir;
    }
  }
  return undefined;
}

/**
 * Detects the Next.js project structure by identifying app router and/or pages router
 */
export async function detectNextjsStructure({
  basePath = ".",
  logger = createLogger(),
}: NextjsStructureDetectorOptions = {}): Promise<NextjsStructure> {
  // Resolve the base path to an absolute path
  const absoluteBasePath = path.resolve(process.cwd(), basePath);

  // Validate that the directory exists
  await validateDirectory(absoluteBasePath);

  logger.debug(`Detecting Next.js structure in: ${absoluteBasePath}`);

  // Define potential directory paths to check
  const appDirPaths = [
    path.join(absoluteBasePath, "app"),
    path.join(absoluteBasePath, "src", "app"),
  ];

  const pagesDirPaths = [
    path.join(absoluteBasePath, "pages"),
    path.join(absoluteBasePath, "src", "pages"),
  ];

  // Initialize structure detection result
  const structure: NextjsStructure = {
    hasAppRouter: false,
    hasPagesRouter: false,
  };

  // Check for app directory (App Router)
  const appDirectory = await findFirstExistingDirectory(appDirPaths, logger);
  if (appDirectory) {
    structure.hasAppRouter = true;
    structure.appDirectory = appDirectory;
    logger.debug(`Found App Router directory: ${appDirectory}`);
  }

  // Check for pages directory (Pages Router)
  const pagesDirectory = await findFirstExistingDirectory(pagesDirPaths, logger);
  if (pagesDirectory) {
    structure.hasPagesRouter = true;
    structure.pagesDirectory = pagesDirectory;
    logger.debug(`Found Pages Router directory: ${pagesDirectory}`);
  }

  // Log the overall structure detection results
  if (structure.hasAppRouter && structure.hasPagesRouter) {
    logger.info("Detected both App Router and Pages Router");
  } else if (structure.hasAppRouter) {
    logger.info("Detected App Router only");
  } else if (structure.hasPagesRouter) {
    logger.info("Detected Pages Router only");
  } else {
    logger.warn("Could not detect Next.js router structure");
  }

  return structure;
}
