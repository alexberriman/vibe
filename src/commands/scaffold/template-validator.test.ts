import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Stats } from "node:fs";
import {
  TemplateValidator,
  validateTemplate,
  checkFileExists,
  getTemplateFiles,
} from "./template-validator.js";

vi.mock("node:fs/promises");
vi.mock("../../utils/logger.js", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

type MockDirent = {
  name: string;
  isDirectory: () => boolean;
  isFile: () => boolean;
  isBlockDevice: () => boolean;
  isCharacterDevice: () => boolean;
  isSymbolicLink: () => boolean;
  isFIFO: () => boolean;
  isSocket: () => boolean;
  parentPath: string;
  path: string;
};

describe("TemplateValidator", () => {
  let validator: TemplateValidator;
  const mockTemplatePath = "/mock/template/path";

  beforeEach(() => {
    validator = new TemplateValidator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validateTemplate", () => {
    it("should return error if template path is not a directory", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => false,
      } as Stats);

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`Template path is not a directory: ${mockTemplatePath}`);
    });

    it("should validate a complete template successfully", async () => {
      vi.mocked(fs.stat).mockImplementation(async (pathParam) => {
        const pathStr = String(pathParam);
        if (pathStr === mockTemplatePath || pathStr.includes("src")) {
          return { isDirectory: () => true } as Stats;
        }
        return { isDirectory: () => false } as Stats;
      });

      vi.mocked(fs.readdir).mockResolvedValue([
        "package.json",
        "README.md",
        ".gitignore",
        "src",
        "scaffold.config.json",
      ] as string[] as never);

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.toString().includes("package.json")) {
          return JSON.stringify({
            name: "{{projectName}}",
            version: "1.0.0",
            description: "{{description}}",
            author: "{{authorName}}",
            scripts: {
              dev: "vite",
              build: "vite build",
              test: "vitest",
              lint: "eslint",
            },
          });
        }
        if (filePath.toString().includes("scaffold.config.json")) {
          return JSON.stringify({
            name: "test-template",
            description: "Test template",
            prompts: [
              {
                name: "projectName",
                message: "Project name?",
                type: "text",
              },
            ],
          });
        }
        return "";
      });

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should return errors for missing required files", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
      } as Stats);

      vi.mocked(fs.readdir).mockResolvedValue(["README.md", ".gitignore"] as string[] as never);

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required file: package.json");
    });

    it("should return warnings for missing recommended files", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
      } as Stats);

      vi.mocked(fs.readdir).mockResolvedValue(["package.json"] as string[] as never);

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          name: "{{projectName}}",
          version: "1.0.0",
          description: "{{description}}",
        })
      );

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "Missing README.md - recommended for template documentation"
      );
      expect(result.warnings).toContain("Missing .gitignore - recommended for version control");
    });
  });

  describe("checkFileExists", () => {
    it("should return true if file exists", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const exists = await validator.checkFileExists(mockTemplatePath, "test.txt");

      expect(exists).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(path.join(mockTemplatePath, "test.txt"));
    });

    it("should return false if file does not exist", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));

      const exists = await validator.checkFileExists(mockTemplatePath, "test.txt");

      expect(exists).toBe(false);
    });
  });

  describe("getTemplateFiles", () => {
    it("should return list of all files excluding .git", async () => {
      vi.mocked(fs.readdir).mockImplementation(async (dir, options?: unknown) => {
        const dirStr = String(dir);

        const createMockDirent = (name: string, isDir: boolean): MockDirent => ({
          name,
          isDirectory: () => isDir,
          isFile: () => !isDir,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false,
          parentPath: dirStr,
          path: dirStr,
        });

        if (options && typeof options === "object" && "withFileTypes" in options) {
          if (dirStr === mockTemplatePath) {
            return [
              createMockDirent("package.json", false),
              createMockDirent("README.md", false),
              createMockDirent(".git", true),
              createMockDirent("src", true),
            ] as unknown as never;
          }
          if (dirStr.includes("src")) {
            return [
              createMockDirent("index.ts", false),
              createMockDirent("app.tsx", false),
            ] as unknown as never;
          }
        }
        return [];
      });

      const files = await validator.getTemplateFiles(mockTemplatePath);

      expect(files).toContain("package.json");
      expect(files).toContain("README.md");
      expect(files).toContain(path.join("src", "index.ts"));
      expect(files).toContain(path.join("src", "app.tsx"));
      expect(files).not.toContain(".git");
      expect(files).not.toContain(path.join(".git", "HEAD"));
    });
  });

  describe("convenience functions", () => {
    it("validateTemplate should use singleton instance", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
      } as Stats);
      vi.mocked(fs.readdir).mockResolvedValue(["package.json"] as string[] as never);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ name: "test", version: "1.0.0" }));

      const result = await validateTemplate(mockTemplatePath);
      expect(result).toBeDefined();
    });

    it("checkFileExists should use singleton instance", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const exists = await checkFileExists(mockTemplatePath, "test.txt");
      expect(exists).toBe(true);
    });

    it("getTemplateFiles should use singleton instance", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const files = await getTemplateFiles(mockTemplatePath);
      expect(files).toEqual([]);
    });
  });

  describe("package.json validation", () => {
    beforeEach(() => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
      } as Stats);
      vi.mocked(fs.readdir).mockResolvedValue(["package.json"] as string[] as never);
    });

    it("should warn if package.json lacks placeholders", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          name: "my-app",
          version: "1.0.0",
          description: "A cool app",
          author: "John Doe",
        })
      );

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "package.json name should contain placeholders like {{projectName}}"
      );
      expect(result.warnings).toContain(
        "package.json description should contain placeholders like {{description}}"
      );
      expect(result.warnings).toContain(
        "package.json author should contain placeholders like {{authorName}}"
      );
    });

    it("should error on invalid JSON", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("{ invalid json");

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("package.json contains invalid JSON");
    });

    it("should warn about missing recommended scripts", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          name: "{{projectName}}",
          version: "1.0.0",
          scripts: {
            start: "node index.js",
          },
        })
      );

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.warnings).toContain("package.json missing recommended script: dev");
      expect(result.warnings).toContain("package.json missing recommended script: build");
      expect(result.warnings).toContain("package.json missing recommended script: test");
      expect(result.warnings).toContain("package.json missing recommended script: lint");
    });
  });

  describe("scaffold.config.json validation", () => {
    beforeEach(() => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
      } as Stats);
      vi.mocked(fs.readdir).mockResolvedValue([
        "package.json",
        "scaffold.config.json",
      ] as string[] as never);
    });

    it("should validate correct scaffold config", async () => {
      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.toString().includes("package.json")) {
          return JSON.stringify({ name: "{{projectName}}", version: "1.0.0" });
        }
        if (filePath.toString().includes("scaffold.config.json")) {
          return JSON.stringify({
            name: "test-template",
            description: "Test template",
            prompts: [
              {
                name: "projectName",
                message: "What is your project name?",
                type: "text",
              },
            ],
            placeholders: {
              projectName: "{{projectName}}",
            },
            postProcessing: [
              {
                name: "Install dependencies",
                command: "npm install",
              },
            ],
          });
        }
        return "";
      });

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should error on missing required fields", async () => {
      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.toString().includes("package.json")) {
          return JSON.stringify({ name: "{{projectName}}", version: "1.0.0" });
        }
        if (filePath.toString().includes("scaffold.config.json")) {
          return JSON.stringify({
            prompts: [],
          });
        }
        return "";
      });

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("scaffold.config.json missing required field: name");
      expect(result.errors).toContain("scaffold.config.json missing required field: description");
    });

    it("should validate prompt structure", async () => {
      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.toString().includes("package.json")) {
          return JSON.stringify({ name: "{{projectName}}", version: "1.0.0" });
        }
        if (filePath.toString().includes("scaffold.config.json")) {
          return JSON.stringify({
            name: "test",
            description: "test",
            prompts: [
              {
                message: "Question?",
                type: "invalid-type",
              },
              {
                name: "valid",
                message: "Valid?",
                type: "text",
              },
            ],
          });
        }
        return "";
      });

      const result = await validator.validateTemplate(mockTemplatePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "scaffold.config.json prompt[0] missing required field: name"
      );
      expect(result.errors).toContain(
        "scaffold.config.json prompt[0] has invalid type: invalid-type"
      );
    });
  });
});
