import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RouterFileType } from "./types.js";
import { BaseRouterDetector } from "./base-detector.js";

// Mock fs module
vi.mock("node:fs/promises", () => {
  return {
    default: {
      readFile: vi.fn(),
    },
    readFile: vi.fn(),
  };
});

// Create a concrete implementation of BaseRouterDetector for testing
class TestRouterDetector extends BaseRouterDetector {
  protected routerImportPatterns = ["from 'test-router'"];
  protected routerComponentPatterns = ["<TestRouter"];

  public getRouterType(): RouterFileType {
    return "jsx";
  }

  public async determineRouterType(): Promise<RouterFileType> {
    return "jsx";
  }
}

describe("BaseRouterDetector", () => {
  let detector: TestRouterDetector;

  beforeEach(() => {
    detector = new TestRouterDetector();
    vi.resetAllMocks();
  });

  describe("detectRouterFile", () => {
    it("should return router info when file is a router definition", async () => {
      // Arrange
      const hasRouterImportsSpy = vi.spyOn(detector, "hasRouterImports").mockResolvedValue(true);
      const hasRouterComponentsSpy = vi
        .spyOn(detector, "hasRouterComponents")
        .mockResolvedValue(true);
      const determineRouterTypeSpy = vi
        .spyOn(detector, "determineRouterType")
        .mockResolvedValue("jsx");

      // Act
      const result = await detector.detectRouterFile("router.tsx");

      // Assert
      expect(result).toEqual({
        filePath: "router.tsx",
        isRouter: true,
        routerType: "jsx",
      });
      expect(hasRouterImportsSpy).toHaveBeenCalled();
      expect(hasRouterComponentsSpy).toHaveBeenCalled();
      expect(determineRouterTypeSpy).toHaveBeenCalled();
    });

    it("should return non-router info when file has no router imports", async () => {
      // Arrange
      const hasRouterImportsSpy = vi.spyOn(detector, "hasRouterImports").mockResolvedValue(false);
      const hasRouterComponentsSpy = vi.spyOn(detector, "hasRouterComponents");
      const determineRouterTypeSpy = vi.spyOn(detector, "determineRouterType");

      // Act
      const result = await detector.detectRouterFile("not-router.tsx");

      // Assert
      expect(result).toEqual({
        filePath: "not-router.tsx",
        isRouter: false,
        routerType: "unknown",
      });
      expect(hasRouterImportsSpy).toHaveBeenCalled();
      expect(hasRouterComponentsSpy).not.toHaveBeenCalled();
      expect(determineRouterTypeSpy).not.toHaveBeenCalled();
    });

    it("should return non-router info when file has router imports but no components", async () => {
      // Arrange
      const hasRouterImportsSpy = vi.spyOn(detector, "hasRouterImports").mockResolvedValue(true);
      const hasRouterComponentsSpy = vi
        .spyOn(detector, "hasRouterComponents")
        .mockResolvedValue(false);
      const determineRouterTypeSpy = vi.spyOn(detector, "determineRouterType");

      // Act
      const result = await detector.detectRouterFile("partial-router.tsx");

      // Assert
      expect(result).toEqual({
        filePath: "partial-router.tsx",
        isRouter: false,
        routerType: "unknown",
      });
      expect(hasRouterImportsSpy).toHaveBeenCalled();
      expect(hasRouterComponentsSpy).toHaveBeenCalled();
      expect(determineRouterTypeSpy).not.toHaveBeenCalled();
    });
  });
});
