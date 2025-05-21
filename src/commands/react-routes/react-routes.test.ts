import { describe, it, expect } from "vitest";
import { reactRoutesCommand } from "./react-routes.js";

describe("reactRoutesCommand", () => {
  const command = reactRoutesCommand();

  it("should be defined", () => {
    expect(command).toBeDefined();
  });

  it("should have the correct name", () => {
    expect(command.name()).toBe("react-routes");
  });

  it("should have the correct description", () => {
    expect(command.description()).toBe(
      "Analyzes a React app directory and generates a JSON array of application routes as URLs"
    );
  });

  it("should have the required options", () => {
    const options = command.options.map((option) => option.flags);
    expect(options).toContain("-p, --path <path>");
    expect(options).toContain("-P, --port <port>");
    expect(options).toContain("-o, --output <output>");
    expect(options).toContain("--pretty");
    expect(options).toContain("-f, --filter <filter>");
    expect(options).toContain("-e, --extensions <extensions>");
  });
});
