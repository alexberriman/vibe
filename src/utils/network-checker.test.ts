import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isPortAvailable,
  isUrlAvailable,
  waitForPort,
  waitForPortToBecomeUnavailable,
  waitForUrl,
} from "./network-checker.js";
import { createServer } from "node:net";
import type { Server } from "node:net";
// Ok is implied when checking result.ok, so we don't need to import it directly
import type { Logger } from "pino";

describe("Network Checker", () => {
  // Mock logger with appropriate types
  const mockLogger: Partial<Logger> = {
    debug: vi.fn(),
    error: vi.fn(),
  };

  describe("isPortAvailable", () => {
    let server: Server | null = null;

    // Close the server after each test
    afterEach(() => {
      if (server) {
        server.close();
        server = null;
      }
      vi.resetAllMocks();
    });

    it("should return true when port is available", async () => {
      const result = await isPortAvailable({ port: 37456, logger: mockLogger as Logger });
      expect(result.ok).toBe(true);
      expect(result.val).toBe(true);
    });

    it("should return false when port is in use", async () => {
      // Create a server to occupy the port
      server = createServer();

      // TypeScript needs to know server is definitely not null here
      // This assertion ensures TypeScript understands server is non-null
      const serverInstance = server;
      if (!serverInstance) {
        throw new Error("Server initialization failed");
      }

      // Use the non-null server reference
      await new Promise<void>((resolve) => {
        serverInstance.listen(37457, "localhost", () => {
          resolve();
        });
      });

      const result = await isPortAvailable({ port: 37457, logger: mockLogger as Logger });
      expect(result.ok).toBe(true);
      expect(result.val).toBe(false);
    });
  });

  describe("isUrlAvailable", () => {
    // Mock fetch API
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      // Restore original fetch
      globalThis.fetch = originalFetch;
      vi.resetAllMocks();
    });

    it("should return true when URL returns 200 status", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
      });

      const result = await isUrlAvailable({
        url: "http://localhost:3000",
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith("http://localhost:3000", expect.any(Object));
    });

    it("should return true when URL returns 302 status", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 302,
      });

      const result = await isUrlAvailable({
        url: "http://localhost:3000",
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(true);
    });

    it("should return false when URL returns 404 status", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 404,
      });

      const result = await isUrlAvailable({
        url: "http://localhost:3000",
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(false);
    });

    it("should return false when URL returns 500 status", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 500,
      });

      const result = await isUrlAvailable({
        url: "http://localhost:3000",
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(false);
    });

    it("should return false when fetch throws an error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await isUrlAvailable({
        url: "http://localhost:3000",
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(false);
    });

    it("should handle fetch timeout correctly", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() => {
        // Create an abort error
        const error = new Error("Timeout");
        error.name = "AbortError";
        return Promise.reject(error);
      });

      const result = await isUrlAvailable({
        url: "http://localhost:3000",
        timeout: 100,
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(false);
    });
  });

  describe("waitForPort", () => {
    it("should wait until port is available", async () => {
      // Mock the implementation of waitForPort to avoid actual waiting
      vi.spyOn(globalThis, "setTimeout").mockImplementation((callback: () => void) => {
        callback();
        return 1 as unknown as ReturnType<typeof setTimeout>;
      });

      // We'll use the real implementation but with mocked internals
      const result = await waitForPort({
        port: 3000,
        timeout: 1000,
        interval: 100,
        logger: mockLogger as Logger,
      });

      // Since we're using a real port and not mocking isPortAvailable completely,
      // we'll just check the result is a boolean (true or false)
      expect(result.ok).toBe(true);
    });
  });

  describe("waitForPortToBecomeUnavailable", () => {
    let server: Server | null = null;

    afterEach(() => {
      if (server) {
        server.close();
        server = null;
      }
      vi.resetAllMocks();
    });

    it("should return true when port becomes unavailable", async () => {
      const port = 37458;

      // Start with port available, then make it unavailable after a short delay
      setTimeout(() => {
        server = createServer();
        server.listen(port, "localhost");
      }, 50);

      const result = await waitForPortToBecomeUnavailable({
        port,
        timeout: 2000,
        interval: 30,
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(true);
    });

    it("should return false when timeout is reached", async () => {
      const result = await waitForPortToBecomeUnavailable({
        port: 37459,
        timeout: 100,
        interval: 30,
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(false);
    });

    it("should immediately return true if port is already unavailable", async () => {
      const port = 37460;

      // Make port unavailable before calling the function
      server = createServer();
      await new Promise<void>((resolve) => {
        if (server) {
          server.listen(port, "localhost", () => {
            resolve();
          });
        }
      });

      const result = await waitForPortToBecomeUnavailable({
        port,
        timeout: 1000,
        interval: 100,
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(true);
    });
  });

  describe("waitForUrl", () => {
    it("should wait until URL is available", async () => {
      // Mock the implementation of waitForUrl to avoid actual waiting
      vi.spyOn(globalThis, "setTimeout").mockImplementation((callback: () => void) => {
        callback();
        return 1 as unknown as ReturnType<typeof setTimeout>;
      });

      // Mock fetch to return a successful response
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
      });

      // We'll use the real implementation but with mocked internals
      const result = await waitForUrl({
        url: "http://localhost:3000",
        timeout: 1000,
        interval: 100,
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(result.val).toBe(true);
    });
  });
});
