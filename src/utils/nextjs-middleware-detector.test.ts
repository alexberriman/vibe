import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs/promises";
import type { Stats } from "node:fs";
import path from "node:path";
import { detectNextjsMiddleware } from "./nextjs-middleware-detector.js";

// Mock fs module
vi.mock("node:fs/promises", () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

const mockFs = vi.mocked(fs);

describe("nextjs-middleware-detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detectNextjsMiddleware", () => {
    it("should detect middleware file at root", async () => {
      mockFs.stat
        .mockResolvedValueOnce({ isFile: () => true } as Stats)
        .mockRejectedValue(new Error("File not found"));

      mockFs.readFile.mockResolvedValueOnce(`
        import { NextResponse } from 'next/server';
        
        export function middleware(request) {
          return NextResponse.next();
        }
        
        export const config = {
          matcher: ['/api/:path*', '/admin/:path*']
        };
      `);

      const result = await detectNextjsMiddleware({ basePath: "/test" });

      expect(result.middleware.exists).toBe(true);
      expect(result.middleware.filePath).toBe(path.join("/test", "middleware.ts"));
      expect(result.middleware.matcher).toEqual(["/api/:path*", "/admin/:path*"]);
    });

    it("should detect middleware file in src directory", async () => {
      mockFs.stat
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        .mockResolvedValueOnce({ isFile: () => true } as Stats)
        .mockRejectedValue(new Error("File not found"));

      mockFs.readFile.mockResolvedValueOnce(`
        import { NextResponse } from 'next/server';
        
        export function middleware(request) {
          return NextResponse.next();
        }
        
        export const config = {
          matcher: '/api/:path*'
        };
      `);

      const result = await detectNextjsMiddleware({ basePath: "/test" });

      expect(result.middleware.exists).toBe(true);
      expect(result.middleware.filePath).toBe(path.join("/test", "src", "middleware.ts"));
      expect(result.middleware.matcher).toEqual(["/api/:path*"]);
    });

    it("should return no middleware when none exists", async () => {
      mockFs.stat.mockRejectedValue(new Error("File not found"));

      const result = await detectNextjsMiddleware({ basePath: "/test" });

      expect(result.middleware.exists).toBe(false);
      expect(result.middleware.filePath).toBeUndefined();
      expect(result.middleware.matcher).toBeUndefined();
    });

    it("should detect rewrites in next.config.js", async () => {
      // Mock middleware file checks (4 paths) - all fail
      mockFs.stat
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        // Mock config file checks (3 paths) - first one succeeds
        .mockResolvedValueOnce({ isFile: () => true } as Stats)
        .mockRejectedValue(new Error("File not found"));

      mockFs.readFile.mockResolvedValueOnce(`
          module.exports = {
            async rewrites() {
              return [
                {
                  source: '/api/:slug',
                  destination: '/api/proxy/:slug'
                },
                {
                  source: '/old-path',
                  destination: '/new-path'
                }
              ];
            }
          };
        `);

      const result = await detectNextjsMiddleware({ basePath: "/test" });

      expect(result.rewrites).toHaveLength(2);
      expect(result.rewrites[0]).toEqual({
        source: "/api/:slug",
        destination: "/api/proxy/:slug",
      });
      expect(result.rewrites[1]).toEqual({
        source: "/old-path",
        destination: "/new-path",
      });
    });

    it("should detect redirects in next.config.js", async () => {
      // Mock middleware file checks (4 paths) - all fail
      mockFs.stat
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        .mockRejectedValueOnce(new Error("File not found"))
        // Mock config file checks (3 paths) - first one succeeds
        .mockResolvedValueOnce({ isFile: () => true } as Stats)
        .mockRejectedValue(new Error("File not found"));

      mockFs.readFile.mockResolvedValueOnce(`
          module.exports = {
            async redirects() {
              return [
                {
                  source: '/old-home',
                  destination: '/new-home',
                  permanent: true
                },
                {
                  source: '/temp-redirect',
                  destination: '/target',
                  permanent: false,
                  statusCode: 302
                }
              ];
            }
          };
        `);

      const result = await detectNextjsMiddleware({ basePath: "/test" });

      expect(result.redirects).toHaveLength(2);
      expect(result.redirects[0]).toEqual({
        source: "/old-home",
        destination: "/new-home",
        permanent: true,
      });
      expect(result.redirects[1]).toEqual({
        source: "/temp-redirect",
        destination: "/target",
        permanent: false,
        statusCode: 302,
      });
    });

    it("should return empty arrays when no config file exists", async () => {
      mockFs.stat.mockRejectedValue(new Error("File not found"));

      const result = await detectNextjsMiddleware({ basePath: "/test" });

      expect(result.rewrites).toEqual([]);
      expect(result.redirects).toEqual([]);
    });
  });
});
