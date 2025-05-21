import { describe, it, expect, vi, beforeEach } from "vitest";
import { designFeedbackCommand } from "./design-feedback.js";
import * as childProcess from "node:child_process";

// Mock child_process.spawn
vi.mock("node:child_process", () => ({
  spawn: vi.fn().mockReturnValue({
    on: vi.fn().mockImplementation((event, _callback) => {
      if (event === "close") {
        // Don't actually call process.exit in tests
        // _callback(0);
      }
      return { on: vi.fn() };
    }),
  }),
}));

// Mock process.exit to prevent tests from exiting
// Using _ prefix to indicate intentionally unused variable
const _exitMock = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

describe("designFeedbackCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a command with the correct name and description", () => {
    const command = designFeedbackCommand();

    expect(command.name()).toBe("design-feedback");
    expect(command.description()).toBe(
      "Get AI-powered design feedback using @alexberriman/openai-designer-feedback"
    );
  });

  it("should spawn the underlying package with passed arguments", async () => {
    const command = designFeedbackCommand();

    // Simulate command execution with arguments
    await command.parseAsync(["node", "design-feedback", "--image", "screenshot.png"]);

    expect(childProcess.spawn).toHaveBeenCalledWith(
      "npx",
      ["@alexberriman/openai-designer-feedback", "--image", "screenshot.png"],
      expect.objectContaining({
        stdio: "inherit",
        shell: true,
      })
    );
  });
});
