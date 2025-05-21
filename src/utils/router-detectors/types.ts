import type { Logger } from "pino";

/**
 * Types of React router implementations
 */
export type RouterFileType = "jsx" | "object" | "data-router" | "unknown";

/**
 * Information about a detected router file
 */
export type RouterFileInfo = {
  readonly filePath: string;
  readonly routerType: RouterFileType;
  readonly isRouter: boolean;
};

/**
 * Options for router detection
 */
export type RouterDetectorOptions = {
  readonly logger?: Logger;
};

/**
 * Interface for a router detector implementation
 */
export interface RouterDetector {
  /**
   * Check if a file contains router imports relevant to this detector
   */
  hasRouterImports(filePath: string): Promise<boolean>;

  /**
   * Check if a file contains router components or functions relevant to this detector
   */
  hasRouterComponents(filePath: string): Promise<boolean>;

  /**
   * Determine the router type from file content
   */
  determineRouterType(filePath: string): Promise<RouterFileType>;

  /**
   * Check if a file is a potential React Router definition file
   */
  detectRouterFile(filePath: string, options?: RouterDetectorOptions): Promise<RouterFileInfo>;

  /**
   * Get the router type that this detector is responsible for
   */
  getRouterType(): RouterFileType;
}
