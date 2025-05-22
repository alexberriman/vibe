import { describe, it, expect, vi } from "vitest";
import { serverRunCommand } from "./server-run.js";

// Mock the utilities that the server-run command uses
vi.mock("../../utils/network-checker.js", () => ({
  isPortAvailable: vi.fn(),
  waitForPortToBecomeUnavailable: vi.fn(),
  waitForUrl: vi.fn(),
}));

vi.mock("../../utils/server-launcher.js", () => ({
  launchServer: vi.fn(),
  parseEnvString: vi.fn(),
}));

vi.mock("../../utils/command-runner.js", () => ({
  runCommand: vi.fn(),
}));

vi.mock("../../utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe("serverRunCommand", () => {
  it("should create a command with the correct name", () => {
    const command = serverRunCommand();
    expect(command.name()).toBe("server-run");
  });

  it("should have the correct description", () => {
    const command = serverRunCommand();
    expect(command.description()).toBe(
      "Start a server, wait for it to be ready, run commands against it, then tear it down"
    );
  });

  it("should have the required options", () => {
    const command = serverRunCommand();
    const options = command.options;

    // Check for key options
    const optionNames = options.map((opt) => opt.long);
    expect(optionNames).toContain("--command");
    expect(optionNames).toContain("--port");
    expect(optionNames).toContain("--url");
    expect(optionNames).toContain("--timeout");
    expect(optionNames).toContain("--wait");
    expect(optionNames).toContain("--verbose");
    expect(optionNames).toContain("--keep-alive");
    expect(optionNames).toContain("--run-command");
    expect(optionNames).toContain("--env");
    expect(optionNames).toContain("--interval");
    expect(optionNames).toContain("--stall-timeout");
  });

  it("should have correct default values", () => {
    const command = serverRunCommand();
    const options = command.options;

    // Find timeout option and check default
    const timeoutOption = options.find((opt) => opt.long === "--timeout");
    expect(timeoutOption?.defaultValue).toBe(60000);

    // Find interval option and check default
    const intervalOption = options.find((opt) => opt.long === "--interval");
    expect(intervalOption?.defaultValue).toBe(1000);

    // Find stall timeout option and check default
    const stallTimeoutOption = options.find((opt) => opt.long === "--stall-timeout");
    expect(stallTimeoutOption?.defaultValue).toBe(30000);

    // Find wait option and check default
    const waitOption = options.find((opt) => opt.long === "--wait");
    expect(waitOption?.defaultValue).toBe(true);

    // Find verbose option and check default
    const verboseOption = options.find((opt) => opt.long === "--verbose");
    expect(verboseOption?.defaultValue).toBe(false);

    // Find keep-alive option and check default
    const keepAliveOption = options.find((opt) => opt.long === "--keep-alive");
    expect(keepAliveOption?.defaultValue).toBe(false);
  });
});
