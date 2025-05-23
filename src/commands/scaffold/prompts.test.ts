import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isValidPackageName,
  createTemplatePrompt,
  createProjectNamePrompt,
  createDescriptionPrompt,
  createAuthorNamePrompt,
  createAuthorEmailPrompt,
  createOutputDirectoryPrompt,
  createOverwritePrompt,
  getTemplateInfo,
  getAllTemplates,
} from "./prompts";
import * as path from "node:path";

describe("prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isValidPackageName", () => {
    it("should accept valid npm package names", () => {
      expect(isValidPackageName("my-package")).toBe(true);
      expect(isValidPackageName("mypackage")).toBe(true);
      expect(isValidPackageName("my-package-123")).toBe(true);
      expect(isValidPackageName("@scope/package")).toBe(true);
      expect(isValidPackageName("a")).toBe(true);
    });

    it("should reject invalid npm package names", () => {
      expect(isValidPackageName("")).toBe(false);
      expect(isValidPackageName("My-Package")).toBe(false); // uppercase
      expect(isValidPackageName("my package")).toBe(false); // space
      expect(isValidPackageName(".mypackage")).toBe(false); // starts with dot
      expect(isValidPackageName("_mypackage")).toBe(false); // starts with underscore
      expect(isValidPackageName("my/package")).toBe(false); // invalid slash
      expect(isValidPackageName("a".repeat(215))).toBe(false); // too long
    });
  });

  describe("createTemplatePrompt", () => {
    it("should create a select prompt with available templates", () => {
      const prompt = createTemplatePrompt();

      expect(prompt.type).toBe("select");
      expect(prompt.name).toBe("template");
      expect(prompt.message).toBe("Select a project template");
      expect(prompt.choices).toHaveLength(1);
      const choices = prompt.choices as Array<{ title: string; value: string }>;
      expect(choices[0]).toEqual({
        title: "vibe-react - Modern React application with TypeScript, Vite, and Tailwind CSS",
        value: "vibe-react",
      });
    });
  });

  describe("createProjectNamePrompt", () => {
    it("should create a text prompt with validation", () => {
      const prompt = createProjectNamePrompt();

      expect(prompt.type).toBe("text");
      expect(prompt.name).toBe("projectName");
      expect(prompt.message).toBe("Project name");
      expect(prompt.initial).toBe("my-project");
    });

    it("should use provided initial value", () => {
      const prompt = createProjectNamePrompt("custom-name");
      expect(prompt.initial).toBe("custom-name");
    });

    it("should validate project names", () => {
      const prompt = createProjectNamePrompt();
      const validate = prompt.validate as (value: string) => string | boolean;

      expect(validate("")).toBe("Project name is required");
      expect(validate("Invalid Name")).toContain("Invalid project name");
      expect(validate("valid-name")).toBe(true);
    });
  });

  describe("createDescriptionPrompt", () => {
    it("should create a text prompt with default", () => {
      const prompt = createDescriptionPrompt();

      expect(prompt.type).toBe("text");
      expect(prompt.name).toBe("description");
      expect(prompt.message).toBe("Project description");
      expect(prompt.initial).toBe("A new project");
    });
  });

  describe("createAuthorNamePrompt", () => {
    it("should create a text prompt with git name as initial", () => {
      const prompt = createAuthorNamePrompt("John Doe");

      expect(prompt.type).toBe("text");
      expect(prompt.name).toBe("authorName");
      expect(prompt.message).toBe("Author name");
      expect(prompt.initial).toBe("John Doe");
    });

    it("should handle null git name", () => {
      const prompt = createAuthorNamePrompt(null);
      expect(prompt.initial).toBe("");
    });
  });

  describe("createAuthorEmailPrompt", () => {
    it("should create a text prompt with git email as initial", () => {
      const prompt = createAuthorEmailPrompt("john@example.com");

      expect(prompt.type).toBe("text");
      expect(prompt.name).toBe("authorEmail");
      expect(prompt.message).toBe("Author email");
      expect(prompt.initial).toBe("john@example.com");
    });

    it("should handle null git email", () => {
      const prompt = createAuthorEmailPrompt(null);
      expect(prompt.initial).toBe("");
    });
  });

  describe("createOutputDirectoryPrompt", () => {
    it("should create a text prompt with project name in path", () => {
      const prompt = createOutputDirectoryPrompt("my-project");

      expect(prompt.type).toBe("text");
      expect(prompt.name).toBe("outputDirectory");
      expect(prompt.message).toBe("Output directory");
      expect(prompt.initial).toBe(path.join(process.cwd(), "my-project"));
    });
  });

  describe("createOverwritePrompt", () => {
    it("should create a confirm prompt", () => {
      const prompt = createOverwritePrompt("/path/to/dir");

      expect(prompt.type).toBe("confirm");
      expect(prompt.name).toBe("confirmOverwrite");
      expect(prompt.message).toBe("Directory /path/to/dir already exists. Overwrite?");
      expect(prompt.initial).toBe(false);
    });
  });

  describe("getTemplateInfo", () => {
    it("should return template info for valid name", () => {
      const template = getTemplateInfo("vibe-react");
      expect(template).toEqual({
        name: "vibe-react",
        description: "Modern React application with TypeScript, Vite, and Tailwind CSS",
        repository: "git@github.com:alexberriman/vibe-react.git",
      });
    });

    it("should return undefined for unknown template", () => {
      const template = getTemplateInfo("unknown");
      expect(template).toBeUndefined();
    });
  });

  describe("getAllTemplates", () => {
    it("should return all available templates", () => {
      const templates = getAllTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe("vibe-react");
    });
  });
});
