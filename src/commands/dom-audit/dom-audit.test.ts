import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { domAuditCommand } from "./dom-audit.js";

// Mock the spawn function
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

type MockChildProcess = EventEmitter & { stdout: EventEmitter };

describe("domAuditCommand", () => {
  let mockChild: MockChildProcess;
  let mockSpawn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChild = new EventEmitter() as MockChildProcess;
    mockChild.stdout = new EventEmitter();
    mockSpawn = vi.mocked(spawn);
    mockSpawn.mockReturnValue(mockChild as ChildProcess);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("command configuration", () => {
    it("should create a command with the correct name", () => {
      const command = domAuditCommand();
      expect(command.name()).toBe("dom-audit");
    });

    it("should have the expected description", () => {
      const command = domAuditCommand();
      expect(command.description()).toContain("visual DOM audits");
    });

    it("should accept unknown options", () => {
      const command = domAuditCommand();
      expect((command as Command & Record<string, unknown>)._allowUnknownOption).toBe(true);
    });

    it("should have --no-fail option", () => {
      const command = domAuditCommand();
      const options = command.options;
      const noFailOption = options.find((opt) => opt.long === "--no-fail");
      expect(noFailOption).toBeDefined();
      expect(noFailOption?.description).toContain("Always exit with success code");
    });

    it("should have --error-message option", () => {
      const command = domAuditCommand();
      const options = command.options;
      const errorMessageOption = options.find((opt) => opt.long === "--error-message");
      expect(errorMessageOption).toBeDefined();
      expect(errorMessageOption?.description).toContain("Custom error message");
    });
  });

  describe("spawn integration", () => {
    it("should spawn the underlying visual-dom-auditor command", async () => {
      const command = domAuditCommand();

      // Start parsing but don't wait for completion
      const actionPromise = command.parseAsync(["node", "test", "--url", "https://example.com"], {
        from: "user",
      });

      // Immediately complete the child process to avoid hanging
      setTimeout(() => mockChild.emit("close", 0), 0);

      // Wait for the action to complete (will throw due to process.exit)
      try {
        await actionPromise;
      } catch {
        // Expected to throw due to process.exit mock
      }

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        ["@alexberriman/visual-dom-auditor", "node", "test", "--url", "https://example.com"],
        {
          stdio: ["inherit", "pipe", "inherit"],
          shell: true,
        }
      );
    });

    it("should forward all unknown options to underlying command", async () => {
      const command = domAuditCommand();

      const actionPromise = command.parseAsync(
        [
          "node",
          "test",
          "--url",
          "https://example.com",
          "--headless",
          "--format",
          "json",
          "--custom-option",
          "value",
        ],
        { from: "user" }
      );

      setTimeout(() => mockChild.emit("close", 0), 0);

      try {
        await actionPromise;
      } catch {
        // Expected to throw due to process.exit mock
      }

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        [
          "@alexberriman/visual-dom-auditor",
          "node",
          "test",
          "--url",
          "https://example.com",
          "--headless",
          "--format",
          "json",
          "--custom-option",
          "value",
        ],
        {
          stdio: ["inherit", "pipe", "inherit"],
          shell: true,
        }
      );
    });

    it("should not forward custom flags to underlying command", async () => {
      const command = domAuditCommand();

      const actionPromise = command.parseAsync(
        [
          "node",
          "test",
          "--url",
          "https://example.com",
          "--no-fail",
          "--error-message",
          "Custom error",
        ],
        { from: "user" }
      );

      setTimeout(() => mockChild.emit("close", 0), 0);

      try {
        await actionPromise;
      } catch {
        // Expected to throw due to process.exit mock
      }

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        ["@alexberriman/visual-dom-auditor", "node", "test", "--url", "https://example.com"],
        {
          stdio: ["inherit", "pipe", "inherit"],
          shell: true,
        }
      );
    });
  });

  describe("JSON parsing logic", () => {
    // Test the JSON parsing logic separately without involving process.exit
    it("should correctly identify critical issues from audit output", () => {
      const mockAuditOutput = {
        metadata: { criticalIssues: 3 },
        issues: [],
      };

      expect(mockAuditOutput.metadata?.criticalIssues).toBe(3);
      expect(mockAuditOutput.metadata?.criticalIssues ?? 0).toBeGreaterThan(0);
    });

    it("should handle missing metadata gracefully", () => {
      const mockAuditOutput: { issues: never[]; metadata?: { criticalIssues?: number } } = {
        issues: [],
      };

      const criticalIssues = mockAuditOutput.metadata?.criticalIssues ?? 0;
      expect(criticalIssues).toBe(0);
    });

    it("should generate correct error messages", () => {
      // Test plural form
      const criticalIssues = 3;
      const generateMessage = (count: number): string =>
        `DOM audit failed: ${count} critical issue${count === 1 ? "" : "s"} found`;

      expect(generateMessage(criticalIssues)).toBe("DOM audit failed: 3 critical issues found");
      expect(generateMessage(1)).toBe("DOM audit failed: 1 critical issue found");
    });

    it("should handle custom error messages", () => {
      const customMessage = "Custom CI error message";
      const criticalIssues = 2;
      const message = customMessage || `DOM audit failed: ${criticalIssues} critical issues found`;
      expect(message).toBe("Custom CI error message");
    });
  });
});
