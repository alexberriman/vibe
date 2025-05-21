import { describe, it, expect, vi, type MockInstance } from "vitest";
import { runCommand } from "./command-runner.js";
import { exec } from "node:child_process";
import type { Logger } from "pino";

// Mock child_process
vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

// Define callback type for our tests with parameter names starting with underscore
// to satisfy the linting rule about unused parameters
type ExecCallbackWithUnderscores = (_error: Error | null, _stdout: string, _stderr: string) => void;

describe("Command Runner", () => {
  // Mock logger with appropriate types
  const mockLogger: Partial<Logger> = {
    debug: vi.fn(),
    error: vi.fn(),
  };

  it("should execute command and return result", async () => {
    vi.resetAllMocks();

    // Setup mock exec implementation using a simpler approach to avoid complex type issues
    const mockExec = exec as unknown as MockInstance;
    mockExec.mockImplementation(
      (_cmd: string, _options: unknown, callback: ExecCallbackWithUnderscores) => {
        callback(null, "command output", "");
        return {};
      }
    );

    const result = await runCommand({
      command: "echo 'hello'",
      logger: mockLogger as Logger,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.val).toEqual({
        stdout: "command output",
        stderr: "",
        exitCode: 0,
      });
    }

    expect(mockExec).toHaveBeenCalledWith(
      "echo 'hello'",
      expect.objectContaining({
        timeout: 60000,
      }),
      expect.any(Function)
    );
  });

  it("should handle command errors", async () => {
    vi.resetAllMocks();

    // Setup mock exec implementation
    const mockExec = exec as unknown as MockInstance;
    mockExec.mockImplementation(
      (_cmd: string, _options: unknown, callback: ExecCallbackWithUnderscores) => {
        const error = new Error("Command failed");
        // Add code property to error
        Object.defineProperty(error, "code", { value: 1 });
        callback(error, "", "command error");
        return {};
      }
    );

    const result = await runCommand({
      command: "invalid-command",
      logger: mockLogger as Logger,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.val).toEqual({
        stdout: "",
        stderr: "command error",
        exitCode: 1,
      });
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Command failed with exit code 1: Command failed"
    );
  });

  it("should handle command timeouts", async () => {
    vi.resetAllMocks();

    // Setup mock exec implementation
    const mockExec = exec as unknown as MockInstance;
    mockExec.mockImplementation(
      (_cmd: string, _options: unknown, callback: ExecCallbackWithUnderscores) => {
        const error = new Error("Command timed out");
        // Add signal and killed properties to error
        Object.defineProperty(error, "signal", { value: "SIGTERM" });
        Object.defineProperty(error, "killed", { value: true });
        callback(error, "", "");
        return {};
      }
    );

    const result = await runCommand({
      command: "sleep 100",
      timeout: 1000,
      logger: mockLogger as Logger,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.val.message).toContain("Command timed out after 1000ms");
    }

    expect(mockLogger.error).toHaveBeenCalledWith("Command timed out after 1000ms");
  });

  it("should pass environment variables", async () => {
    vi.resetAllMocks();

    // Setup mock exec implementation
    const mockExec = exec as unknown as MockInstance;
    mockExec.mockImplementation(
      (_cmd: string, _options: unknown, callback: ExecCallbackWithUnderscores) => {
        callback(null, "command output", "");
        return {};
      }
    );

    await runCommand({
      command: "echo $ENV_VAR",
      env: { ENV_VAR: "test_value" },
      logger: mockLogger as Logger,
    });

    expect(mockExec).toHaveBeenCalledWith(
      "echo $ENV_VAR",
      expect.objectContaining({
        env: expect.objectContaining({ ENV_VAR: "test_value" }),
      }),
      expect.any(Function)
    );
  });
});
