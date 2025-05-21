import { describe, expect, it, vi } from "vitest";
import { Command } from "commander";

// Mock the commander package
vi.mock("commander", () => {
  const mockAddCommand = vi.fn();
  const mockParse = vi.fn();
  const mockOutputHelp = vi.fn();

  return {
    Command: vi.fn().mockImplementation(() => ({
      name: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      version: vi.fn().mockReturnThis(),
      usage: vi.fn().mockReturnThis(),
      addCommand: mockAddCommand,
      parse: mockParse,
      outputHelp: mockOutputHelp,
    })),
  };
});

// Mock the commands
vi.mock("./commands/storybook-urls/index.js", () => ({
  storybookUrlsCommand: vi.fn().mockReturnValue("mocked-storybook-urls-command"),
}));

vi.mock("./commands/server-run/index.js", () => ({
  serverRunCommand: vi.fn().mockReturnValue("mocked-server-run-command"),
}));

vi.mock("./commands/react-routes/index.js", () => ({
  reactRoutesCommand: vi.fn().mockReturnValue("mocked-react-routes-command"),
}));

vi.mock("./commands/nextjs-routes/index.js", () => ({
  nextjsRoutesCommand: vi.fn().mockReturnValue("mocked-nextjs-routes-command"),
}));

vi.mock("./commands/dom-audit/index.js", () => ({
  domAuditCommand: vi.fn().mockReturnValue("mocked-dom-audit-command"),
}));

describe("CLI", () => {
  it("should initialize correctly", async () => {
    // Reset process.argv for the test
    const originalArgv = process.argv;
    process.argv = ["node", "src/index.js", "storybook-urls"];

    // Import the index file which will run the CLI initialization
    await import("./index.js");

    // Get the mocked Command constructor
    const CommandConstructor = vi.mocked(Command);

    // Check that Command was constructed
    expect(CommandConstructor).toHaveBeenCalled();

    // Get the mock instance
    const mockCommandInstance = CommandConstructor.mock.results[0].value;

    // Verify the command configuration
    expect(mockCommandInstance.name).toHaveBeenCalledWith("vibe");
    expect(mockCommandInstance.description).toHaveBeenCalled();
    expect(mockCommandInstance.version).toHaveBeenCalled();
    expect(mockCommandInstance.usage).toHaveBeenCalled();

    // Verify that addCommand was called with the mock commands
    expect(mockCommandInstance.addCommand).toHaveBeenCalledWith("mocked-storybook-urls-command");
    expect(mockCommandInstance.addCommand).toHaveBeenCalledWith("mocked-server-run-command");
    expect(mockCommandInstance.addCommand).toHaveBeenCalledWith("mocked-react-routes-command");
    expect(mockCommandInstance.addCommand).toHaveBeenCalledWith("mocked-nextjs-routes-command");
    expect(mockCommandInstance.addCommand).toHaveBeenCalledWith("mocked-dom-audit-command");

    // Verify that parse was called with process.argv
    expect(mockCommandInstance.parse).toHaveBeenCalledWith(process.argv);

    // Restore the original argv
    process.argv = originalArgv;
  });
});
