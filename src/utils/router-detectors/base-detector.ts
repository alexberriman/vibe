import fs from "node:fs/promises";
import { createLogger } from "../logger.js";
import type {
  RouterDetector,
  RouterDetectorOptions,
  RouterFileInfo,
  RouterFileType,
} from "./types.js";

/**
 * Abstract base class for router detectors
 */
export abstract class BaseRouterDetector implements RouterDetector {
  protected abstract routerImportPatterns: string[];
  protected abstract routerComponentPatterns: string[];

  /**
   * Get the router type that this detector is responsible for
   */
  public abstract getRouterType(): RouterFileType;

  /**
   * Check if a file contains router imports relevant to this detector
   */
  public async hasRouterImports(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return this.routerImportPatterns.some((pattern) => content.includes(pattern));
    } catch {
      // File can't be read or doesn't exist
      return false;
    }
  }

  /**
   * Check if a file contains router components or functions relevant to this detector
   */
  public async hasRouterComponents(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return this.routerComponentPatterns.some((pattern) => content.includes(pattern));
    } catch {
      // File can't be read or doesn't exist
      return false;
    }
  }

  /**
   * Determine the router type from file content
   * This will be overridden by concrete implementations to provide specific detection logic
   */
  public abstract determineRouterType(_filePath: string): Promise<RouterFileType>;

  /**
   * Check if a file is a potential React Router definition file
   */
  public async detectRouterFile(
    filePath: string,
    options: RouterDetectorOptions = {}
  ): Promise<RouterFileInfo> {
    const logger = options.logger || createLogger();

    logger.debug(`Checking file for router definitions: ${filePath}`);

    // Check if file has router imports
    const hasImports = await this.hasRouterImports(filePath);

    // If no router imports, not a router file
    if (!hasImports) {
      logger.debug(`No router imports found in: ${filePath}`);
      return { filePath, isRouter: false, routerType: "unknown" };
    }

    // Check if file has router components
    const hasComponents = await this.hasRouterComponents(filePath);

    // If no router components, likely not a router definition file
    if (!hasComponents) {
      logger.debug(`No router components found in: ${filePath}`);
      return { filePath, isRouter: false, routerType: "unknown" };
    }

    // Determine the router type
    const routerType = await this.determineRouterType(filePath);

    logger.debug(`Found router file: ${filePath} (type: ${routerType})`);

    return { filePath, isRouter: true, routerType };
  }
}
