import fs from "node:fs/promises";
import { BaseRouterDetector } from "./base-detector.js";
import type { RouterFileType } from "./types.js";

/**
 * Detector for JSX-style React Router definitions
 */
export class JSXRouterDetector extends BaseRouterDetector {
  protected routerImportPatterns = [
    "from 'react-router'",
    'from "react-router"',
    "from 'react-router-dom'",
    'from "react-router-dom"',
  ];

  protected routerComponentPatterns = [
    "<BrowserRouter",
    "<HashRouter",
    "<MemoryRouter",
    "<Router",
    "<Routes",
    "<Route",
  ];

  /**
   * Get the router type that this detector is responsible for
   */
  public getRouterType(): RouterFileType {
    return "jsx";
  }

  /**
   * Determine if the file contains JSX-style route definitions
   */
  public async determineRouterType(filePath: string): Promise<RouterFileType> {
    try {
      const content = await fs.readFile(filePath, "utf8");

      // Check for JSX route definitions (<Route> components)
      if (content.includes("<Route") || content.includes("<Routes")) {
        return "jsx";
      }

      return "unknown";
    } catch (error) {
      return "unknown";
    }
  }
}
