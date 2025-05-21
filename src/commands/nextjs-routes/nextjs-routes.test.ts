import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { nextjsRoutesCommand } from "./nextjs-routes.js";

// Mock fs.writeFile
vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock console.log
const originalConsoleLog = console.log;
const mockConsoleLog = vi.fn();

// Mock utils
vi.mock("../../utils/logger.js", () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock("../../utils/directory-scanner.js", () => ({
  scanDirectory: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../utils/nextjs-structure-detector.js", () => ({
  detectNextjsStructure: vi.fn().mockResolvedValue({
    hasAppRouter: true,
    hasPagesRouter: true,
    appDirectory: "/test/app",
    pagesDirectory: "/test/pages",
  }),
}));

describe("nextjsRoutesCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = mockConsoleLog;
  });

  // Restore console.log after tests
  afterAll(() => {
    console.log = originalConsoleLog;
  });

  it("should create a command with the correct name and description", () => {
    const command = nextjsRoutesCommand();

    expect(command.name()).toBe("nextjs-routes");
    expect(command.description()).toBe(
      "Analyzes a Next.js app directory and generates a JSON array of application routes as URLs"
    );
  });

  it("should define the expected options", () => {
    const command = nextjsRoutesCommand();
    const options = command.options.map((opt) => opt.flags);

    expect(options).toContain("-p, --path <path>");
    expect(options).toContain("-P, --port <port>");
    expect(options).toContain("-o, --output <o>");
    expect(options).toContain("--pretty");
    expect(options).toContain("-f, --filter <filter>");
    expect(options).toContain("-t, --type <type>");
  });
});
