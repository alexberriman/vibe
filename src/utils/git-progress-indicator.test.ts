import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GitProgressIndicator } from "./git-progress-indicator.js";
import { createLogger } from "./logger.js";

// Mock the logger
vi.mock("./logger.js", () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("GitProgressIndicator", () => {
  let indicator: GitProgressIndicator;
  let mockLogger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLogger = createLogger() as unknown as ReturnType<typeof createLogger>;

    // Mock process.stdout for TTY tests
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      indicator = new GitProgressIndicator();
      expect(indicator).toBeInstanceOf(GitProgressIndicator);
    });

    it("should accept custom options", () => {
      indicator = new GitProgressIndicator({
        title: "Custom Git Operation",
        logger: mockLogger,
        showSpinner: false,
        clearLine: false,
      });
      expect(indicator).toBeInstanceOf(GitProgressIndicator);
    });
  });

  describe("indeterminate progress", () => {
    it("should start indeterminate progress with spinner in TTY mode", () => {
      indicator = new GitProgressIndicator({ logger: mockLogger });
      indicator.startIndeterminate("Cloning repository...");

      // Fast-forward time to trigger spinner updates
      vi.advanceTimersByTime(300);

      expect(process.stdout.write).toHaveBeenCalled();
    });

    it("should log message in non-TTY mode", () => {
      indicator = new GitProgressIndicator({
        logger: mockLogger,
        clearLine: false,
      });
      indicator.startIndeterminate("Processing...");

      expect(mockLogger.info).toHaveBeenCalledWith("Git operation: Processing...");
    });

    it("should stop indeterminate progress", () => {
      indicator = new GitProgressIndicator({ logger: mockLogger });
      indicator.startIndeterminate("Processing...");

      const writeCalls = vi.mocked(process.stdout.write).mock.calls.length;
      indicator.stopIndeterminate();

      // Should clear the line when stopping
      expect(vi.mocked(process.stdout.write).mock.calls.length).toBeGreaterThan(writeCalls);
    });
  });

  describe("git clone progress", () => {
    it("should update git clone progress with all fields", () => {
      indicator = new GitProgressIndicator({
        logger: mockLogger,
        clearLine: false,
      });

      indicator.updateGitClone({
        stage: "Receiving objects",
        percent: 75,
        current: 750,
        total: 1000,
        throughput: "1.23 MiB/s",
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Git operation: Receiving objects: 75% (750/1000), 1.23 MiB/s"
      );
    });

    it("should update git clone progress with minimal fields", () => {
      indicator = new GitProgressIndicator({
        logger: mockLogger,
        clearLine: false,
      });

      indicator.updateGitClone({
        stage: "Counting objects",
      });

      expect(mockLogger.info).toHaveBeenCalledWith("Git operation: Counting objects");
    });
  });

  describe("message updates", () => {
    it("should update with simple message", () => {
      indicator = new GitProgressIndicator({
        logger: mockLogger,
        clearLine: false,
      });

      indicator.updateMessage("Checking remote repository...");

      expect(mockLogger.info).toHaveBeenCalledWith("Git operation: Checking remote repository...");
    });
  });

  describe("completion", () => {
    it("should complete with default message", () => {
      indicator = new GitProgressIndicator({ logger: mockLogger });
      indicator.complete();

      expect(mockLogger.info).toHaveBeenCalledWith("Git operation completed");
    });

    it("should complete with custom message", () => {
      indicator = new GitProgressIndicator({ logger: mockLogger });
      indicator.complete("Repository cloned successfully!");

      expect(mockLogger.info).toHaveBeenCalledWith("Repository cloned successfully!");
    });

    it("should not update after completion", () => {
      indicator = new GitProgressIndicator({
        logger: mockLogger,
        clearLine: false,
      });
      indicator.complete();

      vi.clearAllMocks();
      indicator.updateMessage("Should not appear");

      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe("failure", () => {
    it("should handle failure", () => {
      indicator = new GitProgressIndicator({ logger: mockLogger });
      indicator.fail("Authentication failed");

      expect(mockLogger.error).toHaveBeenCalledWith("Git operation failed: Authentication failed");
    });
  });

  describe("parseGitProgress", () => {
    it("should parse counting objects progress", () => {
      const result = GitProgressIndicator.parseGitProgress("Counting objects: 100% (1234/1234)");

      expect(result).toEqual({
        stage: "Counting objects",
        percent: 100,
        current: 1234,
        total: 1234,
      });
    });

    it("should parse compressing objects progress", () => {
      const result = GitProgressIndicator.parseGitProgress("Compressing objects: 50% (500/1000)");

      expect(result).toEqual({
        stage: "Compressing objects",
        percent: 50,
        current: 500,
        total: 1000,
      });
    });

    it("should parse receiving objects with throughput", () => {
      const result = GitProgressIndicator.parseGitProgress(
        "Receiving objects: 75% (750/1000), 1.23 MiB | 2.45 MiB/s, done."
      );

      expect(result).toEqual({
        stage: "Receiving objects",
        percent: 75,
        current: 750,
        total: 1000,
        throughput: "2.45 MiB/s",
      });
    });

    it("should parse resolving deltas progress", () => {
      const result = GitProgressIndicator.parseGitProgress("Resolving deltas: 100% (123/123)");

      expect(result).toEqual({
        stage: "Resolving deltas",
        percent: 100,
        current: 123,
        total: 123,
      });
    });

    it("should return null for non-progress lines", () => {
      const result = GitProgressIndicator.parseGitProgress("Cloning into 'repository'...");

      expect(result).toBeNull();
    });

    it("should parse progress without object counts", () => {
      const result = GitProgressIndicator.parseGitProgress("Receiving objects: 100%");

      expect(result).toEqual({
        stage: "Receiving objects",
        percent: 100,
        current: undefined,
        total: undefined,
        throughput: undefined,
      });
    });
  });
});
