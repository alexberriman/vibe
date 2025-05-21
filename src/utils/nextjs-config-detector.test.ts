import { describe, it, expect } from "vitest";
import { detectNextjsConfig } from "./nextjs-config-detector.js";
import { createLogger } from "./logger.js";

// We'll mainly test the structure and public API
describe("nextjs-config-detector", () => {
  // Create logger for testing
  const logger = createLogger();

  it("should export a detectNextjsConfig function", () => {
    expect(typeof detectNextjsConfig).toBe("function");
  });

  it("should have correct parameter types", () => {
    // This is more of a TypeScript check, but we can still verify the function signature
    const options = {
      basePath: "/some/path",
      logger,
    };

    // Just verify that we can call the function with these options
    const result = detectNextjsConfig(options);
    expect(result).toBeInstanceOf(Promise);
  });

  it("should use default values for optional parameters", async () => {
    // We're not mocking fs here, just verifying the function doesn't crash with defaults
    // The actual result will depend on the file system and is not predictable in tests
    const result = await detectNextjsConfig();

    // Just verify the shape of the result
    expect(result).toHaveProperty("port");
    expect(result).toHaveProperty("configFound");
    expect(typeof result.port).toBe("number");
    expect(typeof result.configFound).toBe("boolean");
  });
});
