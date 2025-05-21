import fs from "node:fs/promises";
import { BaseRouterDetector } from "./base-detector.js";
import type { RouterFileType } from "./types.js";

/**
 * Detector for data router API React Router definitions
 */
export class DataRouterDetector extends BaseRouterDetector {
  protected routerImportPatterns = [
    "from '@tanstack/react-router'",
    'from "@tanstack/react-router"',
  ];

  protected routerComponentPatterns = ["new Router(", "createRoute", "defineRoutes", "routeTree"];

  /**
   * Get the router type that this detector is responsible for
   */
  public getRouterType(): RouterFileType {
    return "data-router";
  }

  /**
   * Determine if the file contains data router API route definitions
   */
  public async determineRouterType(filePath: string): Promise<RouterFileType> {
    try {
      const content = await fs.readFile(filePath, "utf8");

      // Check for data router API (newer React Router v6+ or Tanstack Router)
      if (
        content.includes("new Router(") ||
        content.includes("createRoute") ||
        content.includes("defineRoutes") ||
        content.includes("routeTree")
      ) {
        return "data-router";
      }

      return "unknown";
    } catch (error) {
      return "unknown";
    }
  }
}
