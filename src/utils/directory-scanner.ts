import path from "node:path";
import fs from "node:fs/promises";
import { globby } from "globby";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";

type DirectoryScannerOptions = {
  readonly basePath?: string;
  readonly fileExtensions?: string[];
  readonly ignorePatterns?: string[];
  readonly logger?: Logger;
};

/**
 * Scan a directory for files matching specific extensions while respecting .gitignore patterns
 */
export async function scanDirectory({
  basePath = ".",
  fileExtensions = [],
  ignorePatterns = [],
  logger = createLogger(),
}: DirectoryScannerOptions = {}): Promise<string[]> {
  // Resolve the base path to an absolute path
  const absoluteBasePath = path.resolve(process.cwd(), basePath);

  // Validate that the directory exists
  try {
    const stats = await fs.stat(absoluteBasePath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${absoluteBasePath}`);
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Directory does not exist: ${absoluteBasePath}`);
    }
    throw error;
  }

  // Create file extension patterns
  const extensionPatterns =
    fileExtensions.length > 0 ? fileExtensions.map((ext) => `**/*${ext}`) : ["**/*"];

  logger.debug(`Scanning directory: ${absoluteBasePath}`);
  logger.debug(`Using extension patterns: ${extensionPatterns.join(", ")}`);

  try {
    // Use globby to find all matching files
    const files = await globby(extensionPatterns, {
      cwd: absoluteBasePath,
      gitignore: true,
      ignore: ignorePatterns,
      absolute: true,
    });

    logger.debug(`Found ${files.length} files`);
    return files;
  } catch (error) {
    logger.error("Error scanning directory");
    if (error instanceof Error) {
      logger.error(error.message);
    }
    throw error;
  }
}
