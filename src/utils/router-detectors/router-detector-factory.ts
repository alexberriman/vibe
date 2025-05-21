import type { Logger } from "pino";
import { createLogger } from "../logger.js";
import type { RouterDetector, RouterDetectorOptions, RouterFileInfo } from "./types.js";
import { JSXRouterDetector } from "./jsx-router-detector.js";
import { ObjectRouterDetector } from "./object-router-detector.js";
import { DataRouterDetector } from "./data-router-detector.js";

/**
 * Factory for creating and using router detectors
 */
export class RouterDetectorFactory {
  private detectors: RouterDetector[] = [];
  private logger: Logger;

  /**
   * Create a new router detector factory
   */
  constructor(options: RouterDetectorOptions = {}) {
    this.logger = options.logger || createLogger();

    // Register default detectors
    this.registerDetector(new JSXRouterDetector());
    this.registerDetector(new ObjectRouterDetector());
    this.registerDetector(new DataRouterDetector());
  }

  /**
   * Register a new router detector
   */
  public registerDetector(detector: RouterDetector): void {
    this.detectors.push(detector);
    this.logger.debug(`Registered router detector for type: ${detector.getRouterType()}`);
  }

  /**
   * Get all registered detectors
   */
  public getDetectors(): RouterDetector[] {
    return [...this.detectors];
  }

  /**
   * Detect if a file is a router definition using all registered detectors
   */
  public async detectRouterFile(
    filePath: string,
    options: RouterDetectorOptions = {}
  ): Promise<RouterFileInfo> {
    const logger = options.logger || this.logger;

    logger.debug(
      `Checking file for router definitions using ${this.detectors.length} detectors: ${filePath}`
    );

    // Try each detector until we find a match
    for (const detector of this.detectors) {
      const result = await detector.detectRouterFile(filePath, { logger });

      // If the detector identifies this as a router file, return the result
      if (result.isRouter) {
        logger.debug(
          `Detector for ${detector.getRouterType()} identified file as router: ${filePath}`
        );
        return result;
      }
    }

    // If no detector identifies this as a router file, return a default result
    logger.debug(`No detector identified file as router: ${filePath}`);
    return { filePath, isRouter: false, routerType: "unknown" };
  }

  /**
   * Find React Router definition files in a list of files
   */
  public async findRouterDefinitionFiles(
    filePaths: string[],
    options: RouterDetectorOptions = {}
  ): Promise<RouterFileInfo[]> {
    const logger = options.logger || this.logger;

    logger.info(`Searching for React Router definition files in ${filePaths.length} files...`);

    const results = await Promise.all(
      filePaths.map((filePath) => this.detectRouterFile(filePath, { logger }))
    );

    // Filter to only include actual router files
    const routerFiles = results.filter((result) => result.isRouter);

    logger.info(`Found ${routerFiles.length} React Router definition files`);

    return routerFiles;
  }
}
