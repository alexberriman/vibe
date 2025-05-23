import { describe, it, expect, beforeEach, vi } from "vitest";
import { PostProcessor } from "./post-processor.js";
import type { PostProcessingStep } from "./template-registry.js";

// Mock CommandRunner
vi.mock("../../utils/command-runner.js", () => ({
  CommandRunner: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
  })),
}));

// Mock ProgressIndicator
vi.mock("../../utils/progress-indicator.js", () => ({
  ProgressIndicator: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe("PostProcessor", () => {
  let postProcessor: PostProcessor;

  beforeEach(() => {
    postProcessor = new PostProcessor();
    vi.clearAllMocks();
  });

  it("should get default post-processing steps", () => {
    const steps = postProcessor.getDefaultSteps();
    expect(steps).toHaveLength(1);
    expect(steps[0].name).toBe("install-dependencies");
    expect(steps[0].command).toBe("npm install");
  });

  it("should handle empty post-processing steps", async () => {
    await expect(
      postProcessor.runPostProcessing("/test/path", [])
    ).resolves.not.toThrow();
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
    const mockRun = vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    (postProcessor as any).commandRunner.run = mockRun;

    const steps: PostProcessingStep[] = [
      {
        name: "test-command",
        command: "echo hello",
      },
    ];

    await postProcessor.runPostProcessing("/test/path", steps);

    expect(mockRun).toHaveBeenCalledWith({
      command: "echo",
      args: ["hello"],
      cwd: "/test/path",
    });
  });

  it("should handle npm install specially", async () => {
    const mockRun = vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    (postProcessor as any).commandRunner.run = mockRun;

    const steps: PostProcessingStep[] = [
      {
        name: "install",
        command: "npm install",
      },
    ];

    await postProcessor.runPostProcessing("/test/path", steps);

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "npm",
        args: ["install"],
        cwd: "/test/path",
      })
    );
  });

  it("should handle command failures", async () => {
    const mockRun = vi.fn().mockResolvedValue({ 
      exitCode: 1, 
      stdout: "", 
      stderr: "Command failed" 
    });
    (postProcessor as any).commandRunner.run = mockRun;

    const steps: PostProcessingStep[] = [
      {
        name: "failing-command",
        command: "false",
      },
    ];

    await expect(
      postProcessor.runPostProcessing("/test/path", steps)
    ).rejects.toThrow("Command failed: false");
  });

  it("should run script steps", async () => {
    const mockRun = vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    (postProcessor as any).commandRunner.run = mockRun;

    const steps: PostProcessingStep[] = [
      {
        name: "test-script",
        script: "setup.js",
      },
    ];

    await postProcessor.runPostProcessing("/test/path", steps);

    expect(mockRun).toHaveBeenCalledWith({
      command: "node",
      args: ["/test/path/setup.js"],
      cwd: "/test/path",
    });
  });
});