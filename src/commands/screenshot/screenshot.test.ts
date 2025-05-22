import { describe, it, expect, vi, beforeEach } from "vitest";
import { screenshotCommand } from "./screenshot.js";
import * as childProcess from "node:child_process";

// Mock child_process.spawn
vi.mock("node:child_process", () => ({
  spawn: vi.fn().mockReturnValue({
    on: vi.fn().mockImplementation((event, _callback) => {
      if (event === "close") {
        // Don't actually call process.exit in tests
        // callback(0);
      }
      return { on: vi.fn() };
    }),
  }),
}));

// Mock process.exit to prevent tests from exiting
const _exitMock = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

describe("screenshotCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a command with the correct name and description", () => {
    const command = screenshotCommand();

    expect(command.name()).toBe("screenshot");
    expect(command.description()).toBe(
      "Take screenshots of web pages using @alexberriman/screenshotter"
    );
  });

  it("should spawn the underlying package with passed arguments", async () => {
    const command = screenshotCommand();

    // Simulate command execution with arguments
    await command.parseAsync(["node", "screenshot", "--url", "https://example.com"]);

    expect(childProcess.spawn).toHaveBeenCalledWith(
      "npx",
      ["@alexberriman/screenshotter", "--url", "https://example.com"],
      expect.objectContaining({
        stdio: "inherit",
        shell: true,
      })
    );
  });
});
