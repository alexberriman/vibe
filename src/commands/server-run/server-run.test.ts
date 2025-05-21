import { describe, it, expect } from "vitest";
import { serverRunCommand } from "./server-run.js";

// Using a simplified approach for testing
describe("serverRunCommand", () => {
  it("should create a command with the correct name", () => {
    const command = serverRunCommand();
    expect(command.name()).toBe("server-run");
  });
});
