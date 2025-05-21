import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import { Stats } from "node:fs";
import type { Logger } from "pino";
import * as globbyModule from "globby";
import { scanDirectory } from "./directory-scanner.js";
import { createLogger } from "./logger.js";

// Mock dependencies
vi.mock("node:fs/promises");
vi.mock("globby");
vi.mock("./logger.js");

describe("scanDirectory", () => {
  const mockLogger: Partial<Logger> = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(createLogger).mockReturnValue(mockLogger as Logger);
    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as Stats);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should scan a directory with default options", async () => {
    vi.mocked(globbyModule.globby).mockResolvedValue([
      "/absolute/path/file1.js",
      "/absolute/path/file2.js",
    ]);

    const result = await scanDirectory();

    expect(globbyModule.globby).toHaveBeenCalledWith(
      ["**/*"],
      expect.objectContaining({
        cwd: expect.any(String),
        gitignore: true,
        ignore: [],
        absolute: true,
      })
    );
    expect(result).toEqual(["/absolute/path/file1.js", "/absolute/path/file2.js"]);
  });

  it("should scan a directory with specific extensions", async () => {
    vi.mocked(globbyModule.globby).mockResolvedValue([
      "/absolute/path/file1.stories.tsx",
      "/absolute/path/file2.stories.tsx",
    ]);

    const result = await scanDirectory({
      fileExtensions: [".stories.tsx", ".stories.jsx"],
    });

    expect(globbyModule.globby).toHaveBeenCalledWith(
      ["**/*.stories.tsx", "**/*.stories.jsx"],
      expect.objectContaining({
        gitignore: true,
      })
    );
    expect(result).toEqual([
      "/absolute/path/file1.stories.tsx",
      "/absolute/path/file2.stories.tsx",
    ]);
  });

  it("should respect custom ignore patterns", async () => {
    vi.mocked(globbyModule.globby).mockResolvedValue(["/absolute/path/file1.js"]);

    await scanDirectory({
      ignorePatterns: ["**/node_modules/**", "**/dist/**"],
    });

    expect(globbyModule.globby).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ignore: ["**/node_modules/**", "**/dist/**"],
      })
    );
  });

  it("should throw an error if the directory does not exist", async () => {
    const error = new Error("Directory does not exist");
    Object.defineProperty(error, "code", { value: "ENOENT" });
    vi.mocked(fs.stat).mockRejectedValue(error);

    await expect(scanDirectory({ basePath: "/non-existent" })).rejects.toThrow(
      "Directory does not exist"
    );
  });

  it("should throw an error if the path is not a directory", async () => {
    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => false } as Stats);

    await expect(scanDirectory({ basePath: "/file.txt" })).rejects.toThrow(
      "Path is not a directory"
    );
  });

  it("should use the provided logger", async () => {
    const customLogger: Partial<Logger> = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      level: "info",
      fatal: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
    };

    vi.mocked(globbyModule.globby).mockResolvedValue(["/path/file.js"]);

    await scanDirectory({ logger: customLogger as Logger });

    expect(customLogger.debug).toHaveBeenCalled();
    expect(createLogger).not.toHaveBeenCalled();
  });
});
