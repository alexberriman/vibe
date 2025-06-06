import path from "node:path";
import fs from "node:fs/promises";
import type { Logger } from "pino";
import { createLogger } from "./logger.js";

export type StorybookConfigResult = {
  readonly configPath: string | null;
  readonly configType: "directory" | "file" | null;
  readonly port?: number;
};

type StorybookConfigDetectorOptions = {
  readonly basePath?: string;
  readonly logger?: Logger;
};

/**
 * Common Storybook configuration locations to check
 */
const CONFIG_LOCATIONS = [
  // Directory-based configurations
  ".storybook",
  "storybook",
  ".config/storybook",
  // File-based configurations
  ".storybook/main.js",
  ".storybook/main.ts",
  ".storybook/main.cjs",
  ".storybook/main.mjs",
  "storybook/main.js",
  "storybook/main.ts",
  ".config/storybook/main.js",
  ".config/storybook/main.ts",
];

/**
 * Detect Storybook configuration in a project directory
 */
export async function detectStorybookConfig({
  basePath = ".",
  logger = createLogger(),
}: StorybookConfigDetectorOptions = {}): Promise<StorybookConfigResult> {
  // Resolve the base path to an absolute path
  const absoluteBasePath = path.resolve(process.cwd(), basePath);
  logger.debug(`Looking for Storybook configuration in: ${absoluteBasePath}`);

  // Check each potential configuration location
  for (const location of CONFIG_LOCATIONS) {
    const fullPath = path.join(absoluteBasePath, location);

    try {
      const stats = await fs.stat(fullPath);

      // Found a directory or file
      if (stats.isDirectory()) {
        logger.debug(`Found Storybook configuration directory: ${fullPath}`);

        // Try to detect port from main config file
        const port = await detectStorybookPort(fullPath, logger);

        return {
          configPath: fullPath,
          configType: "directory",
          port,
        };
      } else if (stats.isFile()) {
        logger.debug(`Found Storybook configuration file: ${fullPath}`);

        // For file paths, use the directory containing the file for port detection
        const configDir = path.dirname(fullPath);
        const port = await detectStorybookPort(configDir, logger);

        return {
          configPath: fullPath,
          configType: "file",
          port,
        };
      }
    } catch (error) {
      // File or directory doesn't exist, continue to the next location
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
  logger.debug("No Storybook configuration found");
  return {
    configPath: null,
    configType: null,
  };
}

/**
 * Try to detect the Storybook port from configuration files
 * This is a basic implementation that would need to be enhanced for more complex cases
 */
async function detectStorybookPort(configDir: string, logger: Logger): Promise<number | undefined> {
  // Common port definition patterns to look for in config files
  const portConfigFiles = [
    path.join(configDir, "main.js"),
    path.join(configDir, "main.ts"),
    path.join(configDir, "main.cjs"),
    path.join(configDir, "main.mjs"),
  ];

  for (const configFile of portConfigFiles) {
    const port = await tryReadPortFromFile(configFile, logger);
    if (port) {
      return port;
    }
  }

  // No port found in config files
  logger.debug("No Storybook port configuration found");
  return undefined;
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
      logger.debug(`Detected Storybook port ${port} in ${configFile}`);
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
  // Direct port configuration
  const portMatch = content.match(/port\s*:\s*(\d+)/);
  if (portMatch && portMatch[1]) {
    return Number(portMatch[1]);
  }

  // Port inside server configuration
  const serverPortMatch = content.match(/server\s*:\s*{\s*port\s*:\s*(\d+)/);
  if (serverPortMatch && serverPortMatch[1]) {
    return Number(serverPortMatch[1]);
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
