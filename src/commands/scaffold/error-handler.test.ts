import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ErrorHandler,
  ScaffoldError,
  ScaffoldErrorType,
  type ErrorContext,
} from "./error-handler.js";

// Mock dependencies
vi.mock("../../utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    level: "info",
  })),
}));

vi.mock("./temp-dir-manager.js", () => ({
  TempDirManager: vi.fn(() => ({
    cleanupAll: vi.fn(),
  })),
}));

vi.mock("node:fs/promises");

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;
  let mockExit: {
    mockImplementation: (fn: () => never) => unknown;
    toHaveBeenCalledWith: (code: number) => void;
  };
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    level: string;
  };

  beforeEach(() => {
    mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never) as unknown as typeof mockExit;
    errorHandler = new ErrorHandler();
    mockLogger = (errorHandler as unknown as { logger: typeof mockLogger }).logger;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ScaffoldError", () => {
    it("should create a scaffold error with correct properties", () => {
      const context: ErrorContext = {
        stage: "template-processing",
        template: "react-template",
        outputDirectory: "/tmp/test",
      };

      const error = new ScaffoldError(
        ScaffoldErrorType.TEMPLATE_ERROR,
        "Template validation failed",
        context
      );

      expect(error.type).toBe(ScaffoldErrorType.TEMPLATE_ERROR);
      expect(error.message).toBe("Template validation failed");
      expect(error.context).toBe(context);
      expect(error.name).toBe("ScaffoldError");
    });
  });

  describe("categorizeError", () => {
    const context: ErrorContext = { stage: "git-clone" };

    it("should categorize network errors", () => {
      const networkError = new Error("Network connection failed");
      const categorized = errorHandler.categorizeError(networkError, context);

      expect(categorized.type).toBe(ScaffoldErrorType.NETWORK_ERROR);
      expect(categorized.message).toContain("Network error during git-clone");
    });

    it("should categorize permission errors", () => {
      const permissionError = new Error("EACCES: permission denied");
      const categorized = errorHandler.categorizeError(permissionError, context);

      expect(categorized.type).toBe(ScaffoldErrorType.PERMISSION_ERROR);
      expect(categorized.message).toContain("Permission error during git-clone");
    });

    it("should categorize git errors", () => {
      const gitError = new Error("git clone failed");
      const categorized = errorHandler.categorizeError(gitError, context);

      expect(categorized.type).toBe(ScaffoldErrorType.GIT_ERROR);
      expect(categorized.message).toContain("Git error during git-clone");
    });

    it("should categorize file system errors", () => {
      const fsError = new Error("ENOENT: no such file or directory");
      const categorized = errorHandler.categorizeError(fsError, context);

      expect(categorized.type).toBe(ScaffoldErrorType.FILE_SYSTEM_ERROR);
      expect(categorized.message).toContain("File system error during git-clone");
    });

    it("should categorize template errors based on stage", () => {
      const templateContext: ErrorContext = { stage: "template-processing" };
      const genericError = new Error("Something went wrong");
      const categorized = errorHandler.categorizeError(genericError, templateContext);

      expect(categorized.type).toBe(ScaffoldErrorType.TEMPLATE_ERROR);
      expect(categorized.message).toContain("Template error during template-processing");
    });

    it("should categorize post-processing errors", () => {
      const postProcessContext: ErrorContext = { stage: "post-processing" };
      const genericError = new Error("npm install failed");
      const categorized = errorHandler.categorizeError(genericError, postProcessContext);

      expect(categorized.type).toBe(ScaffoldErrorType.POST_PROCESSING_ERROR);
      expect(categorized.message).toContain("Post-processing error");
    });

    it("should default to unknown error", () => {
      const unknownError = new Error("Something random");
      const categorized = errorHandler.categorizeError(unknownError, context);

      expect(categorized.type).toBe(ScaffoldErrorType.UNKNOWN_ERROR);
      expect(categorized.message).toContain("Unexpected error during git-clone");
    });
  });

  describe("handleError", () => {
    it("should handle scaffold errors", async () => {
      const context: ErrorContext = {
        stage: "template-processing",
        template: "react-template",
      };

      const scaffoldError = new ScaffoldError(
        ScaffoldErrorType.TEMPLATE_ERROR,
        "Template validation failed",
        context
      );

      await errorHandler.handleError(scaffoldError, context);

      expect(mockLogger.error).toHaveBeenCalledWith("Failed at stage: template-processing");
      expect(mockLogger.error).toHaveBeenCalledWith("Error type: TEMPLATE_ERROR");
      expect(mockLogger.error).toHaveBeenCalledWith("Message: Template validation failed");
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle generic errors by categorizing them", async () => {
      const context: ErrorContext = { stage: "git-clone" };
      const genericError = new Error("Network timeout");

      await errorHandler.handleError(genericError, context);

      expect(mockLogger.error).toHaveBeenCalledWith("Failed at stage: git-clone");
      expect(mockLogger.error).toHaveBeenCalledWith("Error type: NETWORK_ERROR");
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("handleCancellation", () => {
    it("should handle user cancellation gracefully", async () => {
      const context: ErrorContext = {
        stage: "git-clone",
        outputDirectory: "/tmp/test",
      };

      await errorHandler.handleCancellation(context);

      expect(mockLogger.info).toHaveBeenCalledWith("⚠️ Scaffolding cancelled by user");
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe("displayRecoveryGuidance", () => {
    it("should provide network error guidance", () => {
      const context: ErrorContext = { stage: "git-clone", template: "react-template" };
      const error = new ScaffoldError(ScaffoldErrorType.NETWORK_ERROR, "Network failed", context);

      errorHandler.displayRecoveryGuidance(error);

      expect(mockLogger.info).toHaveBeenCalledWith("• Check your internet connection");
      expect(mockLogger.info).toHaveBeenCalledWith("• Template: react-template");
    });

    it("should provide permission error guidance", () => {
      const context: ErrorContext = { stage: "file-creation", outputDirectory: "/tmp/test" };
      const error = new ScaffoldError(ScaffoldErrorType.PERMISSION_ERROR, "Access denied", context);

      errorHandler.displayRecoveryGuidance(error);

      expect(mockLogger.info).toHaveBeenCalledWith("• Check directory permissions");
      expect(mockLogger.info).toHaveBeenCalledWith("• Target directory: /tmp/test");
    });

    it("should provide git error guidance", () => {
      const context: ErrorContext = { stage: "git-init" };
      const error = new ScaffoldError(ScaffoldErrorType.GIT_ERROR, "Git config missing", context);

      errorHandler.displayRecoveryGuidance(error);

      expect(mockLogger.info).toHaveBeenCalledWith("• Ensure git is installed and configured");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "• Check git credentials if accessing private repositories"
      );
    });

    it("should provide generic guidance for unknown errors", () => {
      const context: ErrorContext = { stage: "unknown" };
      const error = new ScaffoldError(ScaffoldErrorType.UNKNOWN_ERROR, "Unknown error", context);

      errorHandler.displayRecoveryGuidance(error);

      expect(mockLogger.info).toHaveBeenCalledWith("• Try running the command again");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "• Use --verbose flag for more detailed error information"
      );
    });
  });

  describe("createContext", () => {
    it("should create error context with minimal options", () => {
      const context = ErrorHandler.createContext("test-stage");

      expect(context.stage).toBe("test-stage");
      expect(context.partiallyCreated).toBe(false);
    });

    it("should create error context with all options", () => {
      const context = ErrorHandler.createContext("test-stage", {
        template: "react-template",
        outputDirectory: "/tmp/test",
        partiallyCreated: true,
      });

      expect(context.stage).toBe("test-stage");
      expect(context.template).toBe("react-template");
      expect(context.outputDirectory).toBe("/tmp/test");
      expect(context.partiallyCreated).toBe(true);
    });
  });

  describe("wrapOperation", () => {
    it("should execute operation successfully", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      const context: ErrorContext = { stage: "test" };

      const result = await errorHandler.wrapOperation(operation, context);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledOnce();
    });

    it("should handle operation errors", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Operation failed"));
      const context: ErrorContext = { stage: "test" };

      // The wrapOperation should call handleError which calls process.exit
      // so we need to expect it to not complete normally
      await expect(errorHandler.wrapOperation(operation, context)).rejects.toThrow(
        "Operation failed"
      );

      expect(operation).toHaveBeenCalledOnce();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
