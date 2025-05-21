import fs from "node:fs/promises";
import { BaseRouterDetector } from "./base-detector.js";
import type { RouterFileType } from "./types.js";

/**
 * Detector for object-based React Router definitions
 */
export class ObjectRouterDetector extends BaseRouterDetector {
  protected routerImportPatterns = [
    "from 'react-router'",
    'from "react-router"',
    "from 'react-router-dom'",
    'from "react-router-dom"',
  ];

  protected routerComponentPatterns = [
    "createBrowserRouter",
    "createHashRouter",
    "createMemoryRouter",
    "createStaticRouter",
    "createRoutesFromElements",
    "RouterProvider",
  ];

  /**
   * Get the router type that this detector is responsible for
   */
  public getRouterType(): RouterFileType {
    return "object";
  }

  /**
   * Determine if the file contains object-based route definitions
   */
  public async determineRouterType(filePath: string): Promise<RouterFileType> {
    try {
      const content = await fs.readFile(filePath, "utf8");

      // Check for object-based route definitions
      if (
        content.includes("createBrowserRouter") ||
        content.includes("createHashRouter") ||
        content.includes("createMemoryRouter") ||
        content.includes("createStaticRouter") ||
        content.includes("createRoutesFromElements")
      ) {
        return "object";
      }

      return "unknown";
    } catch (error) {
      return "unknown";
    }
  }
}
