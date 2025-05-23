import { describe, it, expect, beforeEach, vi } from "vitest";
import { PostProcessor } from "./post-processor.js";
import type { PostProcessingStep } from "./template-registry.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import tsResults from "ts-results";
const { Ok } = tsResults;

// Mock runCommand
vi.mock("../../utils/command-runner.js", async () => {
  const tsResults = await import("ts-results");
  const { Ok } = tsResults.default;
  return {
    runCommand: vi.fn().mockResolvedValue(Ok({ exitCode: 0, stdout: "", stderr: "" })),
  };
});

// Mock ProgressIndicator
vi.mock("../../utils/progress-indicator.js", () => ({
  ProgressIndicator: vi.fn().mockImplementation(() => ({
    increment: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    setTotal: vi.fn(),
    reset: vi.fn(),
    getPercentage: vi.fn(),
  })),
}));

describe("PostProcessor", () => {
  let postProcessor: PostProcessor;

  beforeEach(() => {
    postProcessor = new PostProcessor();
    vi.clearAllMocks();
  });

  it("should get default post-processing steps for project with package.json", async () => {
    // Create a temporary directory with package.json
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "post-test-"));
    await fs.writeFile(path.join(tempDir, "package.json"), "{}");

    try {
      const steps = await postProcessor.getDefaultSteps(tempDir);
      expect(steps).toHaveLength(1);
      expect(steps[0].name).toBe("install-dependencies");
      expect(steps[0].command).toBe("npm install");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should get empty steps for project without package.json", async () => {
    // Create a temporary directory without package.json
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "post-test-"));

    try {
      const steps = await postProcessor.getDefaultSteps(tempDir);
      expect(steps).toHaveLength(0);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should handle empty post-processing steps", async () => {
    await expect(postProcessor.runPostProcessing("/test/path", [])).resolves.not.toThrow();
  });

  it("should handle dry-run mode", async () => {
    const steps: PostProcessingStep[] = [
      {
        name: "test-step",
        command: "echo test",
        description: "Test step",
      },
    ];

    await expect(
      postProcessor.runPostProcessing("/test/path", steps, { dryRun: true })
    ).resolves.not.toThrow();
  });

  it("should run command steps", async () => {
    const { runCommand } = await import("../../utils/command-runner.js");

    const steps: PostProcessingStep[] = [
      {
        name: "test-command",
        command: "echo hello",
      },
    ];

    await postProcessor.runPostProcessing("/test/path", steps);

    expect(runCommand).toHaveBeenCalledWith({
      command: 'cd "/test/path" && echo hello',
      logger: expect.any(Object),
    });
  });

  it("should handle npm install specially", async () => {
    const { runCommand } = await import("../../utils/command-runner.js");

    const steps: PostProcessingStep[] = [
      {
        name: "install",
        command: "npm install",
      },
    ];

    await postProcessor.runPostProcessing("/test/path", steps);

    expect(runCommand).toHaveBeenCalledWith({
      command: 'cd "/test/path" && npm install',
      logger: expect.any(Object),
    });
  });

  it("should handle command failures", async () => {
    const { runCommand } = await import("../../utils/command-runner.js");
    vi.mocked(runCommand).mockResolvedValue(
      Ok({ exitCode: 1, stdout: "", stderr: "Command failed" })
    );

    const steps: PostProcessingStep[] = [
      {
        name: "failing-command",
        command: "false",
      },
    ];

    await expect(postProcessor.runPostProcessing("/test/path", steps)).rejects.toThrow(
      "Command failed: false"
    );
  });

  it("should run script steps", async () => {
    const { runCommand } = await import("../../utils/command-runner.js");

    // Reset mock to return success for this test
    vi.mocked(runCommand).mockResolvedValue(Ok({ exitCode: 0, stdout: "", stderr: "" }));

    const steps: PostProcessingStep[] = [
      {
        name: "test-script",
        script: "setup.js",
      },
    ];

    await postProcessor.runPostProcessing("/test/path", steps);

    expect(runCommand).toHaveBeenCalledWith({
      command: 'cd "/test/path" && node "/test/path/setup.js"',
      logger: expect.any(Object),
    });
  });
});
