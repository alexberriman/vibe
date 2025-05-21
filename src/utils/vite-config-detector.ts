import path from "node:path";
import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";

export type ViteConfigResult = {
  readonly configPath: string | null;
  readonly configType: "file" | null;
  readonly port?: number;
};

type ViteConfigDetectorOptions = {
  readonly basePath?: string;
  readonly logger?: Logger;
};

/**
 * Common Vite configuration locations to check
 */
const CONFIG_LOCATIONS = [
  "vite.config.js",
  "vite.config.ts",
  "vite.config.mjs",
  "vite.config.cjs",
  ".viterc",
  ".viterc.js",
  ".viterc.ts",
];

/**
 * Detect Vite configuration in a project directory
 */
export async function detectViteConfig({
  basePath = ".",
  logger = createLogger(),
}: ViteConfigDetectorOptions = {}): Promise<ViteConfigResult> {
  // Resolve the base path to an absolute path
  const absoluteBasePath = path.resolve(process.cwd(), basePath);
  logger.debug(`Looking for Vite configuration in: ${absoluteBasePath}`);

  // Check each potential configuration location
  for (const location of CONFIG_LOCATIONS) {
    const fullPath = path.join(absoluteBasePath, location);

    try {
      const stats = await fs.stat(fullPath);

      // Found a file
      if (stats.isFile()) {
        logger.debug(`Found Vite configuration file: ${fullPath}`);

        // Try to detect port from config file
        const port = await tryReadPortFromFile(fullPath, logger);

        return {
          configPath: fullPath,
          configType: "file",
          port,
        };
      }
    } catch (error) {
      // File doesn't exist, continue to the next location
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        logger.debug(`Configuration not found at: ${fullPath}`);
        continue;
      }

      // For other errors, log and continue
      logger.warn(
        `Error checking ${fullPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // No configuration found
  logger.debug("No Vite configuration found");
  return {
    configPath: null,
    configType: null,
  };
}

/**
 * Extract port number from a configuration file
 */
async function tryReadPortFromFile(
  configFile: string,
  logger: Logger
): Promise<number | undefined> {
  try {
    const content = await fs.readFile(configFile, "utf8");
    const port = extractPortFromContent(content);

    if (port) {
      logger.debug(`Detected Vite port ${port} in ${configFile}`);
      return port;
    }
  } catch (error) {
    handleFileReadError(error, configFile, logger);
  }

  return undefined;
}

/**
 * Extract port from file content using regex patterns
 */
function extractPortFromContent(content: string): number | undefined {
  // Look for port in server configuration
  const serverPortMatch = content.match(/server\s*:\s*{[^}]*port\s*:\s*(\d+)/s);
  if (serverPortMatch && serverPortMatch[1]) {
    return Number(serverPortMatch[1]);
  }

  // Direct port configuration in defineConfig
  const defineConfigPortMatch = content.match(/defineConfig\s*\(\s*{[^}]*port\s*:\s*(\d+)/s);
  if (defineConfigPortMatch && defineConfigPortMatch[1]) {
    return Number(defineConfigPortMatch[1]);
  }

  // Look for port variable assignment
  const portVarMatch = content.match(/(?:const|let|var)\s+PORT\s*=\s*(\d+)/i);
  if (portVarMatch && portVarMatch[1]) {
    return Number(portVarMatch[1]);
  }

  return undefined;
}

/**
 * Handle errors from file reading operations
 */
function handleFileReadError(error: unknown, configFile: string, logger: Logger): void {
  // File doesn't exist or can't be read
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    logger.debug(`Configuration file not found: ${configFile}`);
    return;
  }

  // For other errors, log and continue
  logger.warn(
    `Error reading ${configFile}: ${error instanceof Error ? error.message : String(error)}`
  );
}
