import { describe, expect, it, vi } from "vitest";
import { storybookUrlsCommand } from "./storybook-urls.js";

vi.mock("../../utils/logger.js", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("storybookUrlsCommand", () => {
  it("should create a command with the correct name", () => {
    const command = storybookUrlsCommand();
    expect(command.name()).toBe("storybook-urls");
  });

  it("should have the expected options", () => {
    const command = storybookUrlsCommand();
    const options = command.options.map((option) => option.flags);

    expect(options).toContain("-p, --path <path>");
    expect(options).toContain("-e, --extensions <extensions>");
    expect(options).toContain("-P, --port <port>");
    expect(options).toContain("-o, --output <output>");
    expect(options).toContain("--pretty");
    expect(options).toContain("-f, --filter <filter>");
  });
});
