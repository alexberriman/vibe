import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import type { PathLike } from "node:fs";
import { Stats } from "node:fs";
import { detectNextjsStructure } from "./nextjs-structure-detector.js";
import { createLogger } from "./logger.js";
import type { Logger } from "pino";

// Mock dependencies
vi.mock("node:fs/promises");
vi.mock("./logger.js");

describe("nextjs-structure-detector", () => {
  const mockLogger: Partial<Logger> = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(createLogger).mockReturnValue(mockLogger as Logger);
    // Default mock for fs.stat to make the base path valid
    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as Stats);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should detect app router only", async () => {
    // Mock stat implementation for app directory
    vi.mocked(fs.stat).mockImplementation((path: PathLike) => {
      const pathStr = String(path);
      if (pathStr.includes("/app")) {
        return Promise.resolve({ isDirectory: () => true } as Stats);
      }
      if (pathStr.includes("/pages")) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve({ isDirectory: () => true } as Stats);
    });

    const result = await detectNextjsStructure({ logger: mockLogger as Logger });

    expect(result.hasAppRouter).toBe(true);
    expect(result.hasPagesRouter).toBe(false);
    expect(result.appDirectory).toBeDefined();
    expect(result.pagesDirectory).toBeUndefined();
  });

  it("should detect pages router only", async () => {
    // Mock stat implementation for pages directory
    vi.mocked(fs.stat).mockImplementation((path: PathLike) => {
      const pathStr = String(path);
      if (pathStr.includes("/pages")) {
        return Promise.resolve({ isDirectory: () => true } as Stats);
      }
      if (pathStr.includes("/app")) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve({ isDirectory: () => true } as Stats);
    });

    const result = await detectNextjsStructure({ logger: mockLogger as Logger });

    expect(result.hasAppRouter).toBe(false);
    expect(result.hasPagesRouter).toBe(true);
    expect(result.appDirectory).toBeUndefined();
    expect(result.pagesDirectory).toBeDefined();
  });

  it("should detect both app and pages routers", async () => {
    // Mock stat implementation for both app and pages directories
    vi.mocked(fs.stat).mockImplementation((path: PathLike) => {
      const pathStr = String(path);
      if (pathStr.includes("/app") || pathStr.includes("/pages")) {
        return Promise.resolve({ isDirectory: () => true } as Stats);
      }
      return Promise.resolve({ isDirectory: () => true } as Stats);
    });

    const result = await detectNextjsStructure({ logger: mockLogger as Logger });

    expect(result.hasAppRouter).toBe(true);
    expect(result.hasPagesRouter).toBe(true);
    expect(result.appDirectory).toBeDefined();
    expect(result.pagesDirectory).toBeDefined();
  });

  it("should detect neither router type when directories don't exist", async () => {
    // Mock stat implementation for base path only
    vi.mocked(fs.stat).mockImplementation((path: PathLike) => {
      const pathStr = String(path);
      if (pathStr.includes("/app") || pathStr.includes("/pages")) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve({ isDirectory: () => true } as Stats);
    });

    const result = await detectNextjsStructure({ logger: mockLogger as Logger });

    expect(result.hasAppRouter).toBe(false);
    expect(result.hasPagesRouter).toBe(false);
    expect(result.appDirectory).toBeUndefined();
    expect(result.pagesDirectory).toBeUndefined();
  });

  it("should throw an error if base path is not a directory", async () => {
    // Mock stat implementation for base path not being a directory
    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => false } as Stats);

    await expect(detectNextjsStructure({ logger: mockLogger as Logger })).rejects.toThrow(
      "Path is not a directory:"
    );
  });

  it("should throw an error if base path does not exist", async () => {
    // Mock stat implementation for base path not existing
    const error = new Error("ENOENT");
    Object.defineProperty(error, "code", { value: "ENOENT" });
    vi.mocked(fs.stat).mockRejectedValue(error);

    await expect(detectNextjsStructure({ logger: mockLogger as Logger })).rejects.toThrow(
      "Directory does not exist:"
    );
  });
});
