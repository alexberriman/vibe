import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TempDirManager } from "./temp-dir-manager.js";

describe("TempDirManager", () => {
  let tempDirManager: TempDirManager;
  let createdDirs: string[] = [];

  beforeEach(() => {
    tempDirManager = new TempDirManager();
    createdDirs = [];
  });

  afterEach(async () => {
    // Clean up any directories created during tests
    await tempDirManager.cleanupAll();

    // Extra cleanup in case something went wrong
    for (const dir of createdDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore errors
      }
    }
  });

  it("should create a temporary directory", async () => {
    const tempDir = await tempDirManager.createTempDir();
    createdDirs.push(tempDir);

    expect(tempDir).toBeTruthy();
    expect(tempDir).toContain("vibe-scaffold-");
    expect(tempDir).toContain(os.tmpdir());

    // Verify directory exists
    const stats = await fs.stat(tempDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it("should create temporary directory with custom prefix", async () => {
    const tempDir = await tempDirManager.createTempDir("test-prefix-");
    createdDirs.push(tempDir);

    expect(tempDir).toContain("test-prefix-");

    // Verify directory exists
    const stats = await fs.stat(tempDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it("should track multiple temporary directories", async () => {
    const dir1 = await tempDirManager.createTempDir();
    const dir2 = await tempDirManager.createTempDir();
    const dir3 = await tempDirManager.createTempDir();

    createdDirs.push(dir1, dir2, dir3);

    expect(tempDirManager.managedDirCount).toBe(3);
    expect(tempDirManager.getManagedDirs()).toContain(dir1);
    expect(tempDirManager.getManagedDirs()).toContain(dir2);
    expect(tempDirManager.getManagedDirs()).toContain(dir3);
  });

  it("should clean up a specific directory", async () => {
    const tempDir = await tempDirManager.createTempDir();
    createdDirs.push(tempDir);

    // Verify directory exists
    const stats = await fs.stat(tempDir);
    expect(stats.isDirectory()).toBe(true);

    // Clean up
    await tempDirManager.cleanupDir(tempDir);

    // Verify directory no longer exists
    await expect(fs.stat(tempDir)).rejects.toThrow();
    expect(tempDirManager.managedDirCount).toBe(0);
  });

  it("should clean up all directories", async () => {
    const dir1 = await tempDirManager.createTempDir();
    const dir2 = await tempDirManager.createTempDir();
    const dir3 = await tempDirManager.createTempDir();

    createdDirs.push(dir1, dir2, dir3);

    expect(tempDirManager.managedDirCount).toBe(3);

    // Clean up all
    await tempDirManager.cleanupAll();

    // Verify all directories no longer exist
    await expect(fs.stat(dir1)).rejects.toThrow();
    await expect(fs.stat(dir2)).rejects.toThrow();
    await expect(fs.stat(dir3)).rejects.toThrow();
    expect(tempDirManager.managedDirCount).toBe(0);
  });

  it("should handle cleanup of non-existent directory gracefully", async () => {
    const tempDir = await tempDirManager.createTempDir();
    createdDirs.push(tempDir);

    // Manually delete the directory
    await fs.rm(tempDir, { recursive: true, force: true });

    // Cleanup should not throw
    await expect(tempDirManager.cleanupDir(tempDir)).resolves.not.toThrow();
    expect(tempDirManager.managedDirCount).toBe(0);
  });

  it("should ignore cleanup of unmanaged directories", async () => {
    const unmanagedDir = path.join(os.tmpdir(), "unmanaged-dir");

    // Should not throw and should not affect managed count
    await expect(tempDirManager.cleanupDir(unmanagedDir)).resolves.not.toThrow();
    expect(tempDirManager.managedDirCount).toBe(0);
  });

  // Skip this test due to fs module mocking limitations
  it.skip("should handle directory creation errors", async () => {
    // TODO: Find a better way to mock fs.mkdtemp
    // The fs module from node:fs/promises doesn't allow property redefinition
  });

  it("should register cleanup handlers only once", async () => {
    // Create multiple instances
    const manager1 = new TempDirManager();
    const manager2 = new TempDirManager();

    // Both should work without issues
    const dir1 = await manager1.createTempDir();
    const dir2 = await manager2.createTempDir();

    createdDirs.push(dir1, dir2);

    await manager1.cleanupAll();
    await manager2.cleanupAll();
  });

  it("should work with verbose logging", async () => {
    const verboseManager = new TempDirManager({ verbose: true });

    const tempDir = await verboseManager.createTempDir();
    createdDirs.push(tempDir);

    expect(tempDir).toBeTruthy();
    await verboseManager.cleanupAll();
  });
});
