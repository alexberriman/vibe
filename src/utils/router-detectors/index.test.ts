import { describe, expect, it, vi } from "vitest";
import { RouterDetectorFactory } from "./router-detector-factory.js";
import * as routerDetectors from "./index.js";
import type { Logger } from "pino";

// Mock the RouterDetectorFactory class
vi.mock("./router-detector-factory.js", () => ({
  RouterDetectorFactory: vi.fn(),
}));

describe("router-detectors module", () => {
  describe("exports", () => {
    it("should export public API", () => {
      // Assert
      expect(routerDetectors).toHaveProperty("detectRouterFile");
      expect(routerDetectors).toHaveProperty("findRouterDefinitionFiles");
      expect(routerDetectors).toHaveProperty("RouterDetectorFactory");
      expect(routerDetectors).toHaveProperty("BaseRouterDetector");
      expect(routerDetectors).toHaveProperty("JSXRouterDetector");
      expect(routerDetectors).toHaveProperty("ObjectRouterDetector");
      expect(routerDetectors).toHaveProperty("DataRouterDetector");
    });
  });

  describe("detectRouterFile", () => {
    it("should call factory method", async () => {
      // Arrange
      const mockFactory = {
        detectRouterFile: vi.fn().mockResolvedValue({
          filePath: "test.tsx",
          isRouter: true,
          routerType: "jsx",
        }),
        findRouterDefinitionFiles: vi.fn(),
      };

      // Mock the constructor to return our mock factory
      vi.mocked(RouterDetectorFactory).mockReturnValue(
        mockFactory as unknown as RouterDetectorFactory
      );

      // Reset the module to use our mocked factory
      vi.resetModules();
      const refreshedModule = await import("./index.js");

      // Act
      await refreshedModule.detectRouterFile("test.tsx", {
        logger: console as unknown as Logger,
      });

      // Assert
      expect(mockFactory.detectRouterFile).toHaveBeenCalledWith("test.tsx", {
        logger: console,
      });
    });
  });

  describe("findRouterDefinitionFiles", () => {
    it("should call factory method", async () => {
      // Arrange
      const mockFactory = {
        detectRouterFile: vi.fn(),
        findRouterDefinitionFiles: vi.fn().mockResolvedValue([
          {
            filePath: "test.tsx",
            isRouter: true,
            routerType: "jsx",
          },
        ]),
      };

      // Mock the constructor to return our mock factory
      vi.mocked(RouterDetectorFactory).mockReturnValue(
        mockFactory as unknown as RouterDetectorFactory
      );

      // Reset the module to use our mocked factory
      vi.resetModules();
      const refreshedModule = await import("./index.js");

      // Act
      await refreshedModule.findRouterDefinitionFiles(["test.tsx"], {
        logger: console as unknown as Logger,
      });

      // Assert
      expect(mockFactory.findRouterDefinitionFiles).toHaveBeenCalledWith(["test.tsx"], {
        logger: console,
      });
    });
  });
});
