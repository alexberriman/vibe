import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the modules before imports
vi.mock("../../utils/logger.js");
vi.mock("./prompts.js");
vi.mock("./template-registry.js");
vi.mock("./git-operations.js");
vi.mock("./template-processor.js");
vi.mock("./post-processor.js");
vi.mock("node:fs/promises");

import { scaffoldCommand, createScaffoldCommand } from "./scaffold";
import type { ScaffoldOptions } from "./scaffold";
import { createLogger } from "../../utils/logger.js";
import { runInteractivePrompts, getTemplateInfo, getAllTemplates } from "./prompts.js";
import { templateRegistry } from "./template-registry.js";
import { cloneTemplate, initializeRepository } from "./git-operations.js";
import { processTemplate } from "./template-processor.js";
import { runPostProcessing, getDefaultPostProcessingSteps } from "./post-processor.js";
import * as fs from "node:fs/promises";

// Setup mocks
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  level: "info",
  fatal: vi.fn(),
  trace: vi.fn(),
  silent: vi.fn(),
} as unknown as ReturnType<typeof createLogger>;

describe("scaffold command", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup logger mock
    vi.mocked(createLogger).mockReturnValue(mockLogger);

    // Setup template mocks
    vi.mocked(getTemplateInfo).mockReturnValue({
      name: "vibe-react",
      description: "Modern React application",
      repository: "git@github.com:alexberriman/vibe-react.git",
    });

    vi.mocked(getAllTemplates).mockReturnValue([
      {
        name: "vibe-react",
        description: "Modern React application",
        repository: "git@github.com:alexberriman/vibe-react.git",
      },
    ]);

    // Mock templateRegistry
    vi.mocked(templateRegistry.loadTemplateConfig).mockResolvedValue({
      name: "vibe-react",
      description: "Modern React application",
      repository: "git@github.com:alexberriman/vibe-react.git",
      placeholders: {
        PROJECT_NAME: "projectName",
        PROJECT_DESCRIPTION: "description",
      },
    });

    // Mock git operations
    vi.mocked(cloneTemplate).mockResolvedValue(undefined);
    vi.mocked(initializeRepository).mockResolvedValue(undefined);

    // Mock template processor
    vi.mocked(processTemplate).mockResolvedValue(undefined);

    // Mock post processor
    vi.mocked(runPostProcessing).mockResolvedValue(undefined);
    vi.mocked(getDefaultPostProcessingSteps).mockReturnValue([]);

    // Mock fs operations
    vi.mocked(fs.stat).mockRejectedValue(new Error("Not found"));
    vi.mocked(fs.rm).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("scaffoldCommand", () => {
    describe("interactive mode", () => {
      it("should run interactive prompts when template is not provided", async () => {
        const options: ScaffoldOptions = {};
        const mockAnswers = {
          template: "vibe-react",
          projectName: "my-project",
          description: "Test project",
          authorName: "Test Author",
          authorEmail: "test@example.com",
          license: "MIT",
          outputDirectory: "/path/to/output",
          confirmOverwrite: true,
        };

        vi.mocked(runInteractivePrompts).mockResolvedValue(mockAnswers);

        await scaffoldCommand(options);

        expect(mockLogger.info).toHaveBeenCalledWith("Running in interactive mode");
        expect(runInteractivePrompts).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith("Scaffolding configuration:");
        expect(mockLogger.info).toHaveBeenCalledWith("  Template: vibe-react");
        expect(mockLogger.info).toHaveBeenCalledWith("  Project: my-project");
        expect(mockLogger.info).toHaveBeenCalledWith("  Output: /path/to/output");
      });

      it("should handle user cancellation", async () => {
        const options: ScaffoldOptions = {};
        const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
          throw new Error("Process exit");
        });

        vi.mocked(runInteractivePrompts).mockResolvedValue(null);

        await expect(scaffoldCommand(options)).rejects.toThrow("Process exit");

        expect(mockLogger.info).toHaveBeenCalledWith("Scaffolding cancelled by user");
        expect(mockExit).toHaveBeenCalledWith(0);
      });
    });

    describe("non-interactive mode", () => {
      it("should work with all required options", async () => {
        const options: ScaffoldOptions = {
          template: "vibe-react",
          name: "my-project",
          description: "Test project",
          author: "Test Author",
          email: "test@example.com",
          output: "/path/to/output",
        };

        await scaffoldCommand(options);

        expect(runInteractivePrompts).not.toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith("Scaffolding configuration:");
        expect(mockLogger.info).toHaveBeenCalledWith("  Template: vibe-react");
        expect(mockLogger.info).toHaveBeenCalledWith("  Project: my-project");
      });

      it("should go to interactive mode when template is missing", async () => {
        const options: ScaffoldOptions = {
          name: "my-project",
        };

        // Mock the interactive prompts to return null (user cancelled)
        vi.mocked(runInteractivePrompts).mockResolvedValue(null);

        const mockExit = vi.spyOn(process, "exit").mockImplementation((): never => {
          throw new Error("Process exit");
        });

        try {
          await scaffoldCommand(options);
        } catch {
          // Expected to throw
        }

        expect(mockLogger.info).toHaveBeenCalledWith("Running in interactive mode");
        expect(runInteractivePrompts).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith("Scaffolding cancelled by user");
        expect(mockExit).toHaveBeenCalledWith(0);
      });

      it("should go to interactive mode when name is missing", async () => {
        const options: ScaffoldOptions = {
          template: "vibe-react",
        };

        // Mock the interactive prompts to return null (user cancelled)
        vi.mocked(runInteractivePrompts).mockResolvedValue(null);

        const mockExit = vi.spyOn(process, "exit").mockImplementation((): never => {
          throw new Error("Process exit");
        });

        try {
          await scaffoldCommand(options);
        } catch {
          // Expected to throw
        }

        expect(mockLogger.info).toHaveBeenCalledWith("Running in interactive mode");
        expect(runInteractivePrompts).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith("Scaffolding cancelled by user");
        expect(mockExit).toHaveBeenCalledWith(0);
      });

      it("should error when template is unknown", async () => {
        const options: ScaffoldOptions = {
          template: "unknown-template",
          name: "my-project",
        };
        const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
          throw new Error("Process exit");
        });

        vi.mocked(getTemplateInfo).mockReturnValue(undefined);

        await expect(scaffoldCommand(options)).rejects.toThrow("Process exit");

        expect(mockLogger.error).toHaveBeenCalledWith("Unknown template: unknown-template");
        expect(mockLogger.info).toHaveBeenCalledWith("Available templates:");
        expect(mockExit).toHaveBeenCalledWith(1);
      });
    });

    it("should log dry-run mode when enabled", async () => {
      const options: ScaffoldOptions = {
        template: "vibe-react",
        name: "my-project",
        dryRun: true,
      };

      await scaffoldCommand(options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Running in dry-run mode - no changes will be made"
      );
      expect(mockLogger.info).toHaveBeenCalledWith("Dry-run complete - no changes were made");
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

      expect(options).toHaveLength(11); // Updated count for license option

      const optionFlags = options.map((opt) => opt.flags);
      expect(optionFlags).toContain("-t, --template <name>");
      expect(optionFlags).toContain("-n, --name <name>");
      expect(optionFlags).toContain("-d, --description <description>");
      expect(optionFlags).toContain("-a, --author <name>");
      expect(optionFlags).toContain("-e, --email <email>");
      expect(optionFlags).toContain("-l, --license <license>");
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
