import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressIndicator } from "./progress-indicator.js";
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

describe("ProgressIndicator", () => {
  let progressIndicator: ProgressIndicator;
  let mockLogger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = createLogger() as unknown as ReturnType<typeof createLogger>;
    progressIndicator = new ProgressIndicator({
      total: 100,
      logger: mockLogger,
    });
  });

  it("should create a new instance with default values", () => {
    expect(progressIndicator).toBeInstanceOf(ProgressIndicator);
  });

  it("should increment progress correctly", () => {
    progressIndicator.increment(10);
    expect(mockLogger.debug).toHaveBeenCalled();

    progressIndicator.increment(20);
    expect(progressIndicator["current"]).toBe(30);
  });

  it("should not exceed total when incrementing", () => {
    progressIndicator.increment(150);
    expect(progressIndicator["current"]).toBe(100);
  });

  it("should update progress to a specific value", () => {
    progressIndicator.update(50);
    expect(progressIndicator["current"]).toBe(50);

    // Ensure it won't go below 0
    progressIndicator.update(-10);
    expect(progressIndicator["current"]).toBe(0);

    // Ensure it won't exceed total
    progressIndicator.update(200);
    expect(progressIndicator["current"]).toBe(100);
  });

  it("should complete the progress", () => {
    progressIndicator.update(50);
    progressIndicator.complete();

    expect(progressIndicator["current"]).toBe(100);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/completed in/));
  });

  it("should reset the progress", () => {
    progressIndicator.update(50);
    progressIndicator.reset();

    expect(progressIndicator["current"]).toBe(0);
  });

  it("should calculate percentage correctly", () => {
    progressIndicator.update(25);
    expect(progressIndicator.getPercentage()).toBe(25);

    progressIndicator.update(75);
    expect(progressIndicator.getPercentage()).toBe(75);

    // Edge case: total is 0
    const zeroTotalProgress = new ProgressIndicator({
      total: 0,
      logger: mockLogger,
    });
    expect(zeroTotalProgress.getPercentage()).toBe(100);
  });

  it("should update total value", () => {
    progressIndicator.update(50);
    progressIndicator.setTotal(200);

    expect(progressIndicator["total"]).toBe(200);
    expect(progressIndicator["current"]).toBe(50);

    // If current exceeds new total, it should be capped
    progressIndicator.update(150);
    progressIndicator.setTotal(100);
    expect(progressIndicator["current"]).toBe(100);
  });
});
