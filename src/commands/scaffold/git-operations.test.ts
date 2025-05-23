import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { GitOperations } from "./git-operations.js";
import { simpleGit } from "simple-git";

// Mock simple-git
vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => ({
    clone: vi.fn(),
    init: vi.fn(),
    add: vi.fn(),
    addConfig: vi.fn(),
    getConfig: vi.fn(),
    outputHandler: vi.fn(),
  })),
}));

// Mock CommandRunner
vi.mock("../../utils/command-runner.js", () => ({
  CommandRunner: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
  })),
}));

describe("GitOperations", () => {
  let gitOps: GitOperations;
  let tempDir: string;

  beforeEach(async () => {
    gitOps = new GitOperations();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "git-ops-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("should check if directory is a git repository", async () => {
    // Create a .git directory
    const gitDir = path.join(tempDir, ".git");
    await fs.mkdir(gitDir);

    const isRepo = await gitOps.isGitRepository(tempDir);
    expect(isRepo).toBe(true);

    // Check non-git directory
    const nonGitDir = path.join(tempDir, "not-git");
    await fs.mkdir(nonGitDir);
    const isNotRepo = await gitOps.isGitRepository(nonGitDir);
    expect(isNotRepo).toBe(false);
  });

  it("should get git config values", async () => {
    const mockGit = simpleGit();
    (mockGit.getConfig as any).mockResolvedValue({ value: "John Doe" });

    const value = await gitOps.getGitConfig("user.name");
    expect(value).toBe("John Doe");
  });

  it("should return null for missing git config", async () => {
    const mockGit = simpleGit();
    (mockGit.getConfig as any).mockRejectedValue(new Error("Not found"));

    const value = await gitOps.getGitConfig("user.missing");
    expect(value).toBeNull();
  });
});