import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseEnvString, launchServer } from "./server-launcher.js";
import { spawn } from "node:child_process";
import type { Logger } from "pino";
import { Buffer } from "node:buffer";

// Mock child_process
vi.mock("node:child_process", () => {
  const EventEmitter = require("node:events");

  return {
    spawn: vi.fn(() => {
      const mockProcess = new EventEmitter();

      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = vi.fn(() => true);
      mockProcess.killed = false;

      return mockProcess;
    }),
  };
});

describe("Server Launcher", () => {
  // Mock logger with appropriate types
  const mockLogger: Partial<Logger> = {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("parseEnvString", () => {
    it("should parse env string into record", () => {
      const envString = "KEY1=value1,KEY2=value2,KEY3=value with spaces";
      const result = parseEnvString(envString);

      expect(result).toEqual({
        KEY1: "value1",
        KEY2: "value2",
        KEY3: "value with spaces",
      });
    });

    it("should handle empty string", () => {
      const result = parseEnvString("");
      expect(result).toEqual({});
    });

    it("should handle malformed strings", () => {
      const envString = "KEY1=value1,BAD_KEY,KEY2=value2";
      const result = parseEnvString(envString);

      expect(result).toEqual({
        KEY1: "value1",
        KEY2: "value2",
      });
    });
  });

  describe("launchServer", () => {
    it("should spawn process with correct arguments", () => {
      const result = launchServer({
        command: "npm run dev",
        env: { NODE_ENV: "development" },
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        "npm",
        ["run", "dev"],
        expect.objectContaining({
          env: expect.objectContaining({ NODE_ENV: "development" }),
          shell: true,
          stdio: "pipe",
        })
      );
    });

    it("should handle stdout data", () => {
      const onData = vi.fn();

      const result = launchServer({
        command: "npm run dev",
        logger: mockLogger as Logger,
        onData,
      });

      expect(result.ok).toBe(true);

      // Get the mocked process
      const mockSpawn = vi.mocked(spawn);
      const mockProcess = mockSpawn.mock.results[0].value;

      // Emit stdout data
      const testData = Buffer.from("Server started");
      mockProcess.stdout.emit("data", testData);

      expect(onData).toHaveBeenCalledWith(testData);
      expect(mockLogger.debug).toHaveBeenCalledWith("Server stdout: Server started");
    });

    it("should handle stderr data", () => {
      const onError = vi.fn();

      const result = launchServer({
        command: "npm run dev",
        logger: mockLogger as Logger,
        onError,
      });

      expect(result.ok).toBe(true);

      // Get the mocked process
      const mockSpawn = vi.mocked(spawn);
      const mockProcess = mockSpawn.mock.results[0].value;

      // Emit stderr data
      const testData = Buffer.from("Error: something went wrong");
      mockProcess.stderr.emit("data", testData);

      expect(onError).toHaveBeenCalledWith(testData);
      expect(mockLogger.debug).toHaveBeenCalledWith("Server stderr: Error: something went wrong");
    });

    it("should handle process exit", () => {
      const onExit = vi.fn();

      const result = launchServer({
        command: "npm run dev",
        logger: mockLogger as Logger,
        onExit,
      });

      expect(result.ok).toBe(true);

      // Get the mocked process
      const mockSpawn = vi.mocked(spawn);
      const mockProcess = mockSpawn.mock.results[0].value;

      // Emit exit event
      mockProcess.emit("exit", 0, null);

      expect(onExit).toHaveBeenCalledWith(0, null);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Server process exited with code 0 and signal null"
      );
    });

    it("should provide a kill function that works", async () => {
      const result = launchServer({
        command: "npm run dev",
        logger: mockLogger as Logger,
      });

      expect(result.ok).toBe(true);

      // Get the server instance
      if (!result.ok) {
        throw new Error("Server launch failed");
      }

      const serverInstance = result.val;

      // Get the mocked process
      const mockSpawn = vi.mocked(spawn);
      const mockProcess = mockSpawn.mock.results[0].value;

      // Call kill
      const killPromise = serverInstance.kill();

      // Emit exit event to resolve the kill promise
      mockProcess.emit("exit", 0, null);

      const killResult = await killPromise;

      expect(killResult.ok).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
    });
  });
});
