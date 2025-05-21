import { describe, expect, it } from "vitest";
import { createLogger } from "./logger.js";

describe("createLogger", () => {
  it("should create a logger instance", () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should create a logger with custom options", () => {
    const logger = createLogger({ level: "debug", pretty: false });
    expect(logger).toBeDefined();
  });
});
