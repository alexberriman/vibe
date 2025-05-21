import type {
  RouterDetector,
  RouterDetectorOptions,
  RouterFileInfo,
  RouterFileType,
} from "./types.js";
import { RouterDetectorFactory } from "./router-detector-factory.js";
import { JSXRouterDetector } from "./jsx-router-detector.js";
import { ObjectRouterDetector } from "./object-router-detector.js";
import { DataRouterDetector } from "./data-router-detector.js";
import { BaseRouterDetector } from "./base-detector.js";

// Create a singleton instance of the factory with default detectors
const defaultFactory = new RouterDetectorFactory();

/**
 * Detect if a file is a React Router definition file
 */
export async function detectRouterFile(
  filePath: string,
  options: RouterDetectorOptions = {}
): Promise<RouterFileInfo> {
  return defaultFactory.detectRouterFile(filePath, options);
}

/**
 * Find React Router definition files in a list of files
 */
export async function findRouterDefinitionFiles(
  filePaths: string[],
  options: RouterDetectorOptions = {}
): Promise<RouterFileInfo[]> {
  return defaultFactory.findRouterDefinitionFiles(filePaths, options);
}

// Export types and classes
export type { RouterDetector, RouterDetectorOptions, RouterFileInfo, RouterFileType };
export {
  RouterDetectorFactory,
  BaseRouterDetector,
  JSXRouterDetector,
  ObjectRouterDetector,
  DataRouterDetector,
};
