import { describe, it, expect } from "vitest";
import { Command } from "commander";
import { domAuditCommand } from "./dom-audit.js";

describe("domAuditCommand", () => {
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
    // Need to cast to Command & Record to access internal property for testing
    expect((command as Command & Record<string, unknown>)._allowUnknownOption).toBe(true);
  });
});
