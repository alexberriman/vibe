import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RouterDetector, RouterFileInfo } from "./types.js";
import { RouterDetectorFactory } from "./router-detector-factory.js";
import { JSXRouterDetector } from "./jsx-router-detector.js";
import { ObjectRouterDetector } from "./object-router-detector.js";
import { DataRouterDetector } from "./data-router-detector.js";

// Mock the detector classes
vi.mock("./jsx-router-detector.js", () => ({
  JSXRouterDetector: vi.fn(),
}));

vi.mock("./object-router-detector.js", () => ({
  ObjectRouterDetector: vi.fn(),
}));

vi.mock("./data-router-detector.js", () => ({
  DataRouterDetector: vi.fn(),
}));

describe("RouterDetectorFactory", () => {
  let factory: RouterDetectorFactory;
  let mockJSXDetector: RouterDetector;
  let mockObjectDetector: RouterDetector;
  let mockDataRouterDetector: RouterDetector;

  beforeEach(() => {
    // Setup mock detectors
    mockJSXDetector = {
      hasRouterImports: vi.fn(),
      hasRouterComponents: vi.fn(),
      determineRouterType: vi.fn(),
      detectRouterFile: vi.fn(),
      getRouterType: vi.fn().mockReturnValue("jsx"),
    };

    mockObjectDetector = {
      hasRouterImports: vi.fn(),
      hasRouterComponents: vi.fn(),
      determineRouterType: vi.fn(),
      detectRouterFile: vi.fn(),
      getRouterType: vi.fn().mockReturnValue("object"),
    };

    mockDataRouterDetector = {
      hasRouterImports: vi.fn(),
      hasRouterComponents: vi.fn(),
      determineRouterType: vi.fn(),
      detectRouterFile: vi.fn(),
      getRouterType: vi.fn().mockReturnValue("data-router"),
    };

    // Mock constructor implementations
    vi.mocked(JSXRouterDetector).mockImplementation(
      () => mockJSXDetector as unknown as JSXRouterDetector
    );
    vi.mocked(ObjectRouterDetector).mockImplementation(
      () => mockObjectDetector as unknown as ObjectRouterDetector
    );
    vi.mocked(DataRouterDetector).mockImplementation(
      () => mockDataRouterDetector as unknown as DataRouterDetector
    );

    // Create factory
    factory = new RouterDetectorFactory();
  });

  describe("constructor", () => {
    it("should register default detectors", () => {
      // Assert
      expect(factory.getDetectors()).toHaveLength(3);
      expect(JSXRouterDetector).toHaveBeenCalled();
      expect(ObjectRouterDetector).toHaveBeenCalled();
      expect(DataRouterDetector).toHaveBeenCalled();
    });
  });

  describe("registerDetector", () => {
    it("should add a detector to the list", () => {
      // Arrange
      const customDetector: RouterDetector = {
        hasRouterImports: vi.fn(),
        hasRouterComponents: vi.fn(),
        determineRouterType: vi.fn(),
        detectRouterFile: vi.fn(),
        getRouterType: vi.fn().mockReturnValue("custom"),
      };

      // Act
      factory.registerDetector(customDetector);

      // Assert
      expect(factory.getDetectors()).toHaveLength(4);
      expect(factory.getDetectors()[3]).toBe(customDetector);
    });
  });

  describe("detectRouterFile", () => {
    it("should return the first positive detection result", async () => {
      // Arrange
      const expectedResult: RouterFileInfo = {
        filePath: "router.tsx",
        isRouter: true,
        routerType: "jsx",
      };

      mockJSXDetector.detectRouterFile = vi.fn().mockResolvedValue(expectedResult);
      mockObjectDetector.detectRouterFile = vi.fn().mockResolvedValue({
        filePath: "router.tsx",
        isRouter: false,
        routerType: "unknown",
      });
      mockDataRouterDetector.detectRouterFile = vi.fn().mockResolvedValue({
        filePath: "router.tsx",
        isRouter: false,
        routerType: "unknown",
      });

      // Act
      const result = await factory.detectRouterFile("router.tsx");

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockJSXDetector.detectRouterFile).toHaveBeenCalledWith(
        "router.tsx",
        expect.anything()
      );
      expect(mockObjectDetector.detectRouterFile).not.toHaveBeenCalled();
      expect(mockDataRouterDetector.detectRouterFile).not.toHaveBeenCalled();
    });

    it("should try all detectors if previous ones fail", async () => {
      // Arrange
      const jsxResult: RouterFileInfo = {
        filePath: "router.tsx",
        isRouter: false,
        routerType: "unknown",
      };

      const objectResult: RouterFileInfo = {
        filePath: "router.tsx",
        isRouter: false,
        routerType: "unknown",
      };

      const dataRouterResult: RouterFileInfo = {
        filePath: "router.tsx",
        isRouter: true,
        routerType: "data-router",
      };

      mockJSXDetector.detectRouterFile = vi.fn().mockResolvedValue(jsxResult);
      mockObjectDetector.detectRouterFile = vi.fn().mockResolvedValue(objectResult);
      mockDataRouterDetector.detectRouterFile = vi.fn().mockResolvedValue(dataRouterResult);

      // Act
      const result = await factory.detectRouterFile("router.tsx");

      // Assert
      expect(result).toEqual(dataRouterResult);
      expect(mockJSXDetector.detectRouterFile).toHaveBeenCalledWith(
        "router.tsx",
        expect.anything()
      );
      expect(mockObjectDetector.detectRouterFile).toHaveBeenCalledWith(
        "router.tsx",
        expect.anything()
      );
      expect(mockDataRouterDetector.detectRouterFile).toHaveBeenCalledWith(
        "router.tsx",
        expect.anything()
      );
    });

    it("should return non-router result if all detectors fail", async () => {
      // Arrange
      const nonRouterResult: RouterFileInfo = {
        filePath: "not-router.tsx",
        isRouter: false,
        routerType: "unknown",
      };

      mockJSXDetector.detectRouterFile = vi.fn().mockResolvedValue(nonRouterResult);
      mockObjectDetector.detectRouterFile = vi.fn().mockResolvedValue(nonRouterResult);
      mockDataRouterDetector.detectRouterFile = vi.fn().mockResolvedValue(nonRouterResult);

      // Act
      const result = await factory.detectRouterFile("not-router.tsx");

      // Assert
      expect(result).toEqual(nonRouterResult);
      expect(mockJSXDetector.detectRouterFile).toHaveBeenCalledWith(
        "not-router.tsx",
        expect.anything()
      );
      expect(mockObjectDetector.detectRouterFile).toHaveBeenCalledWith(
        "not-router.tsx",
        expect.anything()
      );
      expect(mockDataRouterDetector.detectRouterFile).toHaveBeenCalledWith(
        "not-router.tsx",
        expect.anything()
      );
    });
  });

  describe("findRouterDefinitionFiles", () => {
    it("should process multiple files and filter to router files", async () => {
      // Arrange
      const filePaths = ["router.tsx", "not-router.tsx", "another-router.tsx"];

      const routerFileInfo1: RouterFileInfo = {
        filePath: "router.tsx",
        isRouter: true,
        routerType: "jsx",
      };

      const nonRouterFileInfo: RouterFileInfo = {
        filePath: "not-router.tsx",
        isRouter: false,
        routerType: "unknown",
      };

      const routerFileInfo2: RouterFileInfo = {
        filePath: "another-router.tsx",
        isRouter: true,
        routerType: "object",
      };

      vi.spyOn(factory, "detectRouterFile")
        .mockResolvedValueOnce(routerFileInfo1)
        .mockResolvedValueOnce(nonRouterFileInfo)
        .mockResolvedValueOnce(routerFileInfo2);

      // Act
      const results = await factory.findRouterDefinitionFiles(filePaths);

      // Assert
      expect(results).toHaveLength(2);
      expect(results).toContainEqual(routerFileInfo1);
      expect(results).toContainEqual(routerFileInfo2);
      expect(results).not.toContainEqual(nonRouterFileInfo);
      expect(factory.detectRouterFile).toHaveBeenCalledTimes(3);
    });
  });
});
