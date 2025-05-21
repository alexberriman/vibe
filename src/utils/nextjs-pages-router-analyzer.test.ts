import { describe, it, expect, vi, beforeEach } from "vitest";
// Path is imported but not used directly in tests
import { analyzePagesRouter } from "./nextjs-pages-router-analyzer.js";
import * as directoryScanner from "./directory-scanner.js";
import type { Logger } from "pino";

vi.mock("node:fs/promises", async () => {
  return {
    default: {
      stat: vi.fn().mockImplementation((path) => {
        if (path.includes("non-existent")) {
          const error = new Error(`ENOENT: no such file or directory, stat '${path}'`);
          (error as { code?: string }).code = "ENOENT";
          throw error;
        }
        return { isDirectory: () => !path.includes("not-a-directory") };
      }),
    },
  };
});

vi.mock("./directory-scanner.js", () => ({
  scanDirectory: vi.fn(),
}));

describe("nextjs-pages-router-analyzer", () => {
  // Create a minimal mock logger and use type assertion
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error if pages directory is not provided", async () => {
    await expect(analyzePagesRouter({ logger: mockLogger })).rejects.toThrow(
      "Pages directory is required"
    );
  });

  it("should throw an error if pages directory does not exist", async () => {
    await expect(
      analyzePagesRouter({ pagesDirectory: "/non-existent", logger: mockLogger })
    ).rejects.toThrow("Pages directory does not exist");
  });

  it("should throw an error if pages directory is not a directory", async () => {
    await expect(
      analyzePagesRouter({ pagesDirectory: "/not-a-directory", logger: mockLogger })
    ).rejects.toThrow("Path is not a directory");
  });

  it("should correctly analyze pages router structure", async () => {
    const pagesDir = "/valid/pages";
    const mockFiles = [
      "/valid/pages/index.tsx",
      "/valid/pages/about.tsx",
      "/valid/pages/contact.tsx",
      "/valid/pages/blog/index.tsx",
      "/valid/pages/blog/[slug].tsx",
      "/valid/pages/products/[...categories].tsx",
      "/valid/pages/docs/[[...path]].tsx",
      "/valid/pages/api/users/index.ts",
      "/valid/pages/api/posts/[id].ts",
      "/valid/pages/_app.tsx", // Special file that should be excluded
      "/valid/pages/_document.tsx", // Special file that should be excluded
    ];

    vi.mocked(directoryScanner.scanDirectory).mockResolvedValue(mockFiles);

    const result = await analyzePagesRouter({
      pagesDirectory: pagesDir,
      logger: mockLogger,
    });

    // Should exclude _app.tsx and _document.tsx
    expect(result).toHaveLength(9);

    // Check general route counts
    expect(result.filter((r) => r.fileType === "page")).toHaveLength(7);
    expect(result.filter((r) => r.fileType === "api")).toHaveLength(2);
    expect(result.filter((r) => r.isDynamic)).toHaveLength(4);

    // Check some specific routes
    const indexRoute = result.find((r) => r.absolutePath === "/valid/pages/index.tsx");
    expect(indexRoute).toBeDefined();
    expect(indexRoute?.routePath).toBe("/");

    const blogIndexRoute = result.find((r) => r.absolutePath === "/valid/pages/blog/index.tsx");
    expect(blogIndexRoute).toBeDefined();
    expect(blogIndexRoute?.routePath).toBe("/blog");

    const dynamicSlugRoute = result.find((r) => r.absolutePath === "/valid/pages/blog/[slug].tsx");
    expect(dynamicSlugRoute).toBeDefined();
    expect(dynamicSlugRoute?.routePath).toBe("/blog/[slug]");
    expect(dynamicSlugRoute?.isDynamic).toBe(true);
    expect(dynamicSlugRoute?.isCatchAll).toBe(false);

    const catchAllRoute = result.find(
      (r) => r.absolutePath === "/valid/pages/products/[...categories].tsx"
    );
    expect(catchAllRoute).toBeDefined();
    expect(catchAllRoute?.routePath).toBe("/products/[...categories]");
    expect(catchAllRoute?.isDynamic).toBe(true);
    expect(catchAllRoute?.isCatchAll).toBe(true);

    const optionalCatchAllRoute = result.find(
      (r) => r.absolutePath === "/valid/pages/docs/[[...path]].tsx"
    );
    expect(optionalCatchAllRoute).toBeDefined();
    expect(optionalCatchAllRoute?.routePath).toBe("/docs/[[...path]]");
    expect(optionalCatchAllRoute?.isDynamic).toBe(true);
    expect(optionalCatchAllRoute?.isOptionalCatchAll).toBe(true);

    const apiRoute = result.find((r) => r.absolutePath === "/valid/pages/api/users/index.ts");
    expect(apiRoute).toBeDefined();
    expect(apiRoute?.routePath).toBe("/api/users");
    expect(apiRoute?.isApiRoute).toBe(true);
    expect(apiRoute?.fileType).toBe("api");

    const dynamicApiRoute = result.find((r) => r.absolutePath === "/valid/pages/api/posts/[id].ts");
    expect(dynamicApiRoute).toBeDefined();
    expect(dynamicApiRoute?.routePath).toBe("/api/posts/[id]");
    expect(dynamicApiRoute?.isApiRoute).toBe(true);
    expect(dynamicApiRoute?.isDynamic).toBe(true);
  });
});
