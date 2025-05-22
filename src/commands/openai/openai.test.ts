import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { openaiCommand } from "./openai.js";

// Mock the OpenAI module
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

// Mock process
vi.mock("node:process", () => ({
  env: {
    OPENAI_API_KEY: "test-api-key",
  },
  exit: vi.fn(),
}));

// Mock logger
vi.mock("../../utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("openaiCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a command with correct name", () => {
    const command = openaiCommand();
    expect(command.name()).toBe("openai");
  });

  it("should have correct description", () => {
    const command = openaiCommand();
    expect(command.description()).toBe(
      "Prompt OpenAI/ChatGPT with support for system prompts, structured responses, and file inputs"
    );
  });

  it("should have all required options", () => {
    const command = openaiCommand();
    const options = command.options;

    const optionNames = options.map((opt) => opt.long);

    expect(optionNames).toContain("--model");
    expect(optionNames).toContain("--system");
    expect(optionNames).toContain("--system-file");
    expect(optionNames).toContain("--user");
    expect(optionNames).toContain("--user-file");
    expect(optionNames).toContain("--json-schema");
    expect(optionNames).toContain("--json-schema-file");
    expect(optionNames).toContain("--format");
    expect(optionNames).toContain("--verbose");
    expect(optionNames).toContain("--timeout");
    expect(optionNames).toContain("--max-tokens");
    expect(optionNames).toContain("--temperature");
  });

  it("should have correct default values", () => {
    const command = openaiCommand();
    const options = command.options;

    const modelOption = options.find((opt) => opt.long === "--model");
    expect(modelOption?.defaultValue).toBe("gpt-4o-mini");

    const formatOption = options.find((opt) => opt.long === "--format");
    expect(formatOption?.defaultValue).toBe("pretty");

    const timeoutOption = options.find((opt) => opt.long === "--timeout");
    expect(timeoutOption?.defaultValue).toBe("30");

    const maxTokensOption = options.find((opt) => opt.long === "--max-tokens");
    expect(maxTokensOption?.defaultValue).toBe("2048");

    const temperatureOption = options.find((opt) => opt.long === "--temperature");
    expect(temperatureOption?.defaultValue).toBe("0.7");
  });

  it("should have short aliases for common options", () => {
    const command = openaiCommand();
    const options = command.options;

    const modelOption = options.find((opt) => opt.long === "--model");
    expect(modelOption?.short).toBe("-m");

    const systemOption = options.find((opt) => opt.long === "--system");
    expect(systemOption?.short).toBe("-s");

    const userOption = options.find((opt) => opt.long === "--user");
    expect(userOption?.short).toBe("-u");

    const formatOption = options.find((opt) => opt.long === "--format");
    expect(formatOption?.short).toBe("-f");

    const verboseOption = options.find((opt) => opt.long === "--verbose");
    expect(verboseOption?.short).toBe("-v");

    const timeoutOption = options.find((opt) => opt.long === "--timeout");
    expect(timeoutOption?.short).toBe("-t");
  });
});
