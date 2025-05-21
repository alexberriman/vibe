import { describe, it, expect } from "vitest";
import { serverRunCommand } from "./server-run.js";

describe("serverRunCommand", () => {
  it("should create a command with the correct name", () => {
    const command = serverRunCommand();
    expect(command.name()).toBe("server-run");
  });

  it("should have all expected options configured", () => {
    const command = serverRunCommand();

    // Get the command's options
    const options = command.options;

    // Check for command option
    const commandOption = options.find((opt) => opt.long === "--command");
    expect(commandOption).toBeDefined();

    // Check for some optional options
    expect(options.find((opt) => opt.long === "--port")).toBeDefined();
    expect(options.find((opt) => opt.long === "--url")).toBeDefined();
    expect(options.find((opt) => opt.long === "--timeout")).toBeDefined();
    expect(options.find((opt) => opt.long === "--wait")).toBeDefined();
    expect(options.find((opt) => opt.long === "--verbose")).toBeDefined();
    expect(options.find((opt) => opt.long === "--keep-alive")).toBeDefined();
    expect(options.find((opt) => opt.long === "--run-command")).toBeDefined();
    expect(options.find((opt) => opt.long === "--env")).toBeDefined();
  });
});
