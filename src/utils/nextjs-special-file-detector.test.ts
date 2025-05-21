import { describe, it, expect } from "vitest";
import {
  detectNextjsSpecialFile,
  isNextjsSpecialFile,
  filterNextjsSpecialFiles,
  analyzeNextjsFiles,
} from "./nextjs-special-file-detector.js";

describe("nextjs-special-file-detector", () => {
  describe("isNextjsSpecialFile", () => {
    it("should identify page.tsx as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/page.tsx")).toBe(true);
    });

    it("should identify layout.js as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/layout.js")).toBe(true);
    });

    it("should identify route.jsx as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/route.jsx")).toBe(true);
    });

    it("should identify loading.ts as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/loading.ts")).toBe(true);
    });

    it("should identify not-found.tsx as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/not-found.tsx")).toBe(true);
    });

    it("should identify error.js as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/error.js")).toBe(true);
    });

    it("should identify template.tsx as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/template.tsx")).toBe(true);
    });

    it("should identify middleware.ts as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/middleware.ts")).toBe(true);
    });

    it("should identify default.tsx as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/default.tsx")).toBe(true);
    });

    it("should not identify component.tsx as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/component.tsx")).toBe(false);
    });

    it("should not identify utils.js as a special file", () => {
      expect(isNextjsSpecialFile("/path/to/app/utils.js")).toBe(false);
    });

    it("should not identify page.css as a special file (wrong extension)", () => {
      expect(isNextjsSpecialFile("/path/to/app/page.css")).toBe(false);
    });

    it("should not identify page.txt as a special file (wrong extension)", () => {
      expect(isNextjsSpecialFile("/path/to/app/page.txt")).toBe(false);
    });
  });

  describe("detectNextjsSpecialFile", () => {
    it("should detect page.tsx file details correctly", () => {
      const result = detectNextjsSpecialFile("/path/to/app/page.tsx");
      expect(result).toEqual({
        filePath: "/path/to/app/page.tsx",
        fileName: "page.tsx",
        fileType: "page",
        extension: ".tsx",
        isSpecialFile: true,
        isClientComponent: true,
        isServerComponent: false,
      });
    });

    it("should detect route.js file details correctly", () => {
      const result = detectNextjsSpecialFile("/path/to/app/route.js");
      expect(result).toEqual({
        filePath: "/path/to/app/route.js",
        fileName: "route.js",
        fileType: "route",
        extension: ".js",
        isSpecialFile: true,
        isClientComponent: false,
        isServerComponent: true,
      });
    });

    it("should detect regular component file details correctly", () => {
      const result = detectNextjsSpecialFile("/path/to/app/component.tsx");
      expect(result).toEqual({
        filePath: "/path/to/app/component.tsx",
        fileName: "component.tsx",
        fileType: "other",
        extension: ".tsx",
        isSpecialFile: false,
        isClientComponent: true,
        isServerComponent: false,
      });
    });
  });

  describe("filterNextjsSpecialFiles", () => {
    it("should filter out non-special files", () => {
      const files = [
        "/path/to/app/page.tsx",
        "/path/to/app/component.tsx",
        "/path/to/app/layout.js",
        "/path/to/app/utils.js",
        "/path/to/app/error.tsx",
        "/path/to/app/styles.css",
      ];

      const result = filterNextjsSpecialFiles(files);
      expect(result).toEqual([
        "/path/to/app/page.tsx",
        "/path/to/app/layout.js",
        "/path/to/app/error.tsx",
      ]);
    });

    it("should return empty array when no special files are present", () => {
      const files = [
        "/path/to/app/component.tsx",
        "/path/to/app/utils.js",
        "/path/to/app/styles.css",
      ];

      const result = filterNextjsSpecialFiles(files);
      expect(result).toEqual([]);
    });
  });

  describe("analyzeNextjsFiles", () => {
    it("should analyze and filter files correctly", () => {
      const files = [
        "/path/to/app/page.tsx",
        "/path/to/app/component.tsx",
        "/path/to/app/layout.js",
      ];

      const result = analyzeNextjsFiles(files);
      expect(result).toHaveLength(2);
      expect(result[0].fileType).toBe("page");
      expect(result[1].fileType).toBe("layout");
    });
  });
});
