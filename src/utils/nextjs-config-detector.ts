import path from "node:path";
import fs from "node:fs/promises";
import { createLogger } from "./logger.js";
import type { Logger } from "pino";

export type NextjsConfigResult = {
  port: number;
  configFound: boolean;
  configSource?: string;
};

type NextjsConfigDetectorOptions = {
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
  } catch (error) {
    return false;
  }
}

/**
 * Try to parse port from a script command line (e.g., "next dev -p 3000")
 */
function parsePortFromScript(script: string): number | undefined {
  // Match -p XXXX or --port XXXX or -p=XXXX or --port=XXXX
  const portFlagMatch = script.match(/(?:-p|--port)(?:=|\s+)(\d+)/);
  if (portFlagMatch && portFlagMatch[1]) {
    const port = Number(portFlagMatch[1]);
    return !isNaN(port) ? port : undefined;
  }
  return undefined;
}

/**
 * Extract port from package.json scripts (dev, start)
 */
async function getPortFromPackageJson(
  basePath: string,
  logger: Logger
): Promise<{ port?: number; source?: string }> {
  const packageJsonPath = path.join(basePath, "package.json");

  if (!(await fileExists(packageJsonPath))) {
    logger.debug("package.json not found");
    return {};
  }

  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    if (!packageJson.scripts) {
      logger.debug("No scripts found in package.json");
      return {};
    }

    // Check dev script first, then start script
    const scriptEntries = [
      { name: "dev", content: packageJson.scripts.dev },
      { name: "start", content: packageJson.scripts.start },
    ];

    for (const script of scriptEntries) {
      if (script.content) {
        const port = parsePortFromScript(script.content);
        if (port) {
          logger.debug(`Found port ${port} in package.json ${script.name} script`);
          return { port, source: `package.json (${script.name} script)` };
        }
      }
    }

    logger.debug("No port configuration found in package.json scripts");
    return {};
  } catch (error) {
    logger.debug("Error parsing package.json", error);
    return {};
  }
}

/**
 * Extract port from .env files
 */
async function getPortFromEnvFiles(
  basePath: string,
  logger: Logger
): Promise<{ port?: number; source?: string }> {
  // Check .env files in priority order
  const envFiles = [".env.local", ".env.development.local", ".env.development", ".env"];

  for (const envFile of envFiles) {
    const envPath = path.join(basePath, envFile);

    if (await fileExists(envPath)) {
      try {
        const envContent = await fs.readFile(envPath, "utf8");

        // Look for PORT= or NEXT_PUBLIC_PORT=
        const portRegex = /^(PORT|NEXT_PUBLIC_PORT)=(\d+)/m;
        const match = envContent.match(portRegex);

        if (match && match[2]) {
          const port = Number(match[2]);
          if (!isNaN(port)) {
            logger.debug(`Found port ${port} in ${envFile}`);
            return { port, source: envFile };
          }
        }
      } catch (error) {
        logger.debug(`Error reading ${envFile}`, error);
      }
    }
  }

  logger.debug("No port configuration found in .env files");
  return {};
}

/**
 * Try to extract a port number from config content using regex patterns
 */
function extractPortFromConfigContent(
  configContent: string,
  configFile: string,
  logger: Logger
): number | undefined {
  // Define patterns to look for port configuration
  const patterns = [
    /serverRuntimeConfig\s*:\s*{[^}]*port\s*:\s*(\d+)/,
    /env\s*:\s*{[^}]*PORT\s*:\s*(\d+)/,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = configContent.match(pattern);
    if (match && match[1]) {
      const port = Number(match[1]);
      if (!isNaN(port)) {
        logger.debug(`Found port ${port} in ${configFile}`);
        return port;
      }
    }
  }

  return undefined;
}

/**
 * Process a Next.js config file
 */
async function processConfigFile(
  configPath: string,
  configFile: string,
  logger: Logger
): Promise<{ port?: number; source?: string }> {
  try {
    const configContent = await fs.readFile(configPath, "utf8");
    const port = extractPortFromConfigContent(configContent, configFile, logger);

    if (port) {
      return { port, source: configFile };
    }

    logger.debug(`No port configuration found in ${configFile}`);
  } catch (error) {
    logger.debug(`Error reading ${configFile}`, error);
  }

  return {};
}

/**
 * Extract port from next.config.js/mjs
 */
async function getPortFromNextConfig(
  basePath: string,
  logger: Logger
): Promise<{ port?: number; source?: string }> {
  // Check both next.config.js and next.config.mjs
  const configFiles = ["next.config.js", "next.config.mjs"];

  for (const configFile of configFiles) {
    const configPath = path.join(basePath, configFile);

    if (await fileExists(configPath)) {
      const result = await processConfigFile(configPath, configFile, logger);
      if (result.port) {
        return result;
      }
    }
  }

  return {};
}

/**
 * Detects Next.js port configuration from various sources
 *
 * This function checks for port configuration in the following order:
 * 1. .env files (.env.local, .env.development.local, .env.development, .env)
 * 2. package.json scripts (dev, start)
 * 3. next.config.js or next.config.mjs files
 *
 * If no configuration is found, it returns the default port 3000.
 */
export async function detectNextjsConfig({
  basePath = ".",
  logger = createLogger(),
}: NextjsConfigDetectorOptions = {}): Promise<NextjsConfigResult> {
  // Resolve the base path to an absolute path
  const absoluteBasePath = path.resolve(process.cwd(), basePath);

  logger.debug(`Detecting Next.js configuration in: ${absoluteBasePath}`);

  // Default port for Next.js
  const defaultPort = 3000;

  // Extract port from .env files
  const envResult = await getPortFromEnvFiles(absoluteBasePath, logger);
  if (envResult.port) {
    logger.info(`Detected Next.js port: ${envResult.port} from ${envResult.source}`);
    return {
      port: envResult.port,
      configFound: true,
      configSource: envResult.source,
    };
  }

  // Extract port from package.json scripts
  const packageResult = await getPortFromPackageJson(absoluteBasePath, logger);
  if (packageResult.port) {
    logger.info(`Detected Next.js port: ${packageResult.port} from ${packageResult.source}`);
    return {
      port: packageResult.port,
      configFound: true,
      configSource: packageResult.source,
    };
  }

  // Extract port from next.config.js/mjs
  const configResult = await getPortFromNextConfig(absoluteBasePath, logger);
  if (configResult.port) {
    logger.info(`Detected Next.js port: ${configResult.port} from ${configResult.source}`);
    return {
      port: configResult.port,
      configFound: true,
      configSource: configResult.source,
    };
  }

  logger.info(`No custom port configuration found, using default port: ${defaultPort}`);
  return {
    port: defaultPort,
    configFound: false,
  };
}
