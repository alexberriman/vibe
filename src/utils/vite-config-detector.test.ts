import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import * as path from "node:path";
import { detectViteConfig } from "./vite-config-detector.js";
import { createLogger } from "./logger.js";

// Mock Node.js modules
vi.mock("node:fs/promises");
vi.mock("node:path");
vi.mock("./logger.js");

describe("vite-config-detector", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock path.resolve
    vi.mocked(path.resolve).mockImplementation((_cwd, basePath) => `/resolved/${basePath}`);

    // Mock path.join
    vi.mocked(path.join).mockImplementation((...parts) => parts.join("/"));

    // Mock the createLogger function
    vi.mocked(createLogger).mockReturnValue(
      mockLogger as unknown as ReturnType<typeof createLogger>
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("detectViteConfig", () => {
    it("should return null when no configuration is found", async () => {
      // Mock fs.stat to throw ENOENT errors for all paths
      vi.mocked(fs.stat).mockRejectedValue({ code: "ENOENT" });

      const result = await detectViteConfig();

      expect(result).toEqual({
        configPath: null,
        configType: null,
      });
    });

    it("should detect vite.config.js and extract port", async () => {
      // Mock fs.stat to succeed only for vite.config.js
      vi.mocked(fs.stat).mockImplementation(async (path) => {
        if (path === "/resolved/./vite.config.js") {
          return { isFile: () => true } as unknown as ReturnType<typeof fs.stat>;
        }
        throw { code: "ENOENT" };
      });

      // Mock fs.readFile to return a configuration with port
      vi.mocked(fs.readFile).mockResolvedValue(`
        import { defineConfig } from 'vite';
        
        export default defineConfig({
          server: {
            port: 4173,
            host: true
          }
        });
      `);

      const result = await detectViteConfig();

      expect(result).toEqual({
        configPath: "/resolved/./vite.config.js",
        configType: "file",
        port: 4173,
      });
    });

    it("should detect configuration without port", async () => {
      // Mock fs.stat to succeed only for vite.config.ts
      vi.mocked(fs.stat).mockImplementation(async (path) => {
        if (path === "/resolved/./vite.config.ts") {
          return { isFile: () => true } as unknown as ReturnType<typeof fs.stat>;
        }
        throw { code: "ENOENT" };
      });

      // Mock fs.readFile to return a configuration without port
      vi.mocked(fs.readFile).mockResolvedValue(`
        import { defineConfig } from 'vite';
        
        export default defineConfig({
          plugins: []
        });
      `);

      const result = await detectViteConfig();

      expect(result).toEqual({
        configPath: "/resolved/./vite.config.ts",
        configType: "file",
        port: undefined,
      });
    });

    it("should handle file read errors", async () => {
      // Mock fs.stat to succeed only for vite.config.js
      vi.mocked(fs.stat).mockImplementation(async (path) => {
        if (path === "/resolved/./vite.config.js") {
          return { isFile: () => true } as unknown as ReturnType<typeof fs.stat>;
        }
        throw { code: "ENOENT" };
      });

      // Mock fs.readFile to throw an error
      vi.mocked(fs.readFile).mockRejectedValue(new Error("Permission denied"));

      const result = await detectViteConfig();

      expect(result).toEqual({
        configPath: "/resolved/./vite.config.js",
        configType: "file",
        port: undefined,
      });

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
