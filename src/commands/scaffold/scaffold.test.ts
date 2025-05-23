import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scaffoldCommand, createScaffoldCommand } from "./scaffold";
import type { ScaffoldOptions } from "./scaffold";

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("../../utils/logger.js", () => ({
  createLogger: vi.fn(() => mockLogger),
}));

describe("scaffold command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("scaffoldCommand", () => {
    it("should log info when starting scaffolding", async () => {
      const options: ScaffoldOptions = {};

      await scaffoldCommand(options);

      expect(mockLogger.info).toHaveBeenCalledWith("Starting project scaffolding...");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Interactive mode: template selection will be prompted"
      );
    });

    it("should log template name when provided", async () => {
      const options: ScaffoldOptions = {
        template: "vibe-react",
      };

      await scaffoldCommand(options);

      expect(mockLogger.info).toHaveBeenCalledWith("Using template: vibe-react");
    });

    it("should log dry-run mode when enabled", async () => {
      const options: ScaffoldOptions = {
        dryRun: true,
      };

      await scaffoldCommand(options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Running in dry-run mode - no changes will be made"
      );
    });

    it("should log defaults mode when enabled", async () => {
      const options: ScaffoldOptions = {
        defaults: true,
      };

      await scaffoldCommand(options);

      expect(mockLogger.info).toHaveBeenCalledWith("Using default values for optional prompts");
    });

    it("should handle errors gracefully", async () => {
      const mockError = new Error("Test error");
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("Process exit");
      });

      vi.mocked(mockLogger.info).mockImplementationOnce(() => {
        throw mockError;
      });

      const options: ScaffoldOptions = {};

      await expect(scaffoldCommand(options)).rejects.toThrow("Process exit");

      expect(mockLogger.error).toHaveBeenCalledWith("Failed to scaffold project", mockError);
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("createScaffoldCommand", () => {
    it("should create a command with correct configuration", () => {
      const command = createScaffoldCommand();

      expect(command.name()).toBe("scaffold");
      expect(command.description()).toBe("Scaffold a new project from a template");
    });

    it("should have all required options", () => {
      const command = createScaffoldCommand();
      const options = command.options;

      expect(options).toHaveLength(6);

      const optionFlags = options.map((opt) => opt.flags);
      expect(optionFlags).toContain("-t, --template <name>");
      expect(optionFlags).toContain("-o, --output <path>");
      expect(optionFlags).toContain("-f, --force");
      expect(optionFlags).toContain("--defaults");
      expect(optionFlags).toContain("--dry-run");
      expect(optionFlags).toContain("-v, --verbose");
    });

    it("should have correct default values", () => {
      const command = createScaffoldCommand();
      const forceOption = command.options.find((opt) => opt.flags === "-f, --force");
      const defaultsOption = command.options.find((opt) => opt.flags === "--defaults");
      const dryRunOption = command.options.find((opt) => opt.flags === "--dry-run");

      expect(forceOption?.defaultValue).toBe(false);
      expect(defaultsOption?.defaultValue).toBe(false);
      expect(dryRunOption?.defaultValue).toBe(false);
    });
  });
});
