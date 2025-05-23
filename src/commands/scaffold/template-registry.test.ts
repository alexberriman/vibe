import { describe, it, expect, beforeEach, vi } from "vitest";
import { TemplateRegistry } from "./template-registry.js";
import type { TemplateMetadata } from "./template-registry.js";

describe("TemplateRegistry", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe("constructor", () => {
    it("should initialize with built-in templates", () => {
      expect(registry.getTemplateCount()).toBeGreaterThan(0);
      expect(registry.hasTemplate("vibe-react")).toBe(true);
    });
  });

  describe("addTemplate", () => {
    it("should add a valid template", () => {
      const template: TemplateMetadata = {
        name: "test-template",
        description: "Test template",
        repository: "https://github.com/test/template.git",
      };

      registry.addTemplate(template);
      expect(registry.hasTemplate("test-template")).toBe(true);
    });

    it("should throw error if name is missing", () => {
      const template = {
        description: "Test template",
        repository: "https://github.com/test/template.git",
      } as TemplateMetadata;

      expect(() => registry.addTemplate(template)).toThrow("Template name is required");
    });

    it("should throw error if repository is missing", () => {
      const template = {
        name: "test-template",
        description: "Test template",
      } as TemplateMetadata;

      expect(() => registry.addTemplate(template)).toThrow("Template repository is required");
    });

    it("should add lastUpdated timestamp if not provided", () => {
      const template: TemplateMetadata = {
        name: "test-template",
        description: "Test template",
        repository: "https://github.com/test/template.git",
      };

      registry.addTemplate(template);
      const savedTemplate = registry.getTemplate("test-template");
      expect(savedTemplate?.lastUpdated).toBeInstanceOf(Date);
    });

    it("should preserve provided lastUpdated timestamp", () => {
      const customDate = new Date("2024-01-01");
      const template: TemplateMetadata = {
        name: "test-template",
        description: "Test template",
        repository: "https://github.com/test/template.git",
        lastUpdated: customDate,
      };

      registry.addTemplate(template);
      const savedTemplate = registry.getTemplate("test-template");
      expect(savedTemplate?.lastUpdated).toEqual(customDate);
    });
  });

  describe("getTemplate", () => {
    it("should return template if exists", () => {
      const template = registry.getTemplate("vibe-react");
      expect(template).toBeDefined();
      expect(template?.name).toBe("vibe-react");
    });

    it("should return undefined if template does not exist", () => {
      const template = registry.getTemplate("non-existent");
      expect(template).toBeUndefined();
    });
  });

  describe("getAllTemplates", () => {
    it("should return all templates", () => {
      const templates = registry.getAllTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.name === "vibe-react")).toBe(true);
    });
  });

  describe("getTemplateNames", () => {
    it("should return all template names", () => {
      const names = registry.getTemplateNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain("vibe-react");
    });
  });

  describe("hasTemplate", () => {
    it("should return true for existing template", () => {
      expect(registry.hasTemplate("vibe-react")).toBe(true);
    });

    it("should return false for non-existing template", () => {
      expect(registry.hasTemplate("non-existent")).toBe(false);
    });
  });

  describe("validateTemplateName", () => {
    it("should return valid for existing template", () => {
      const result = registry.validateTemplateName("vibe-react");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error for empty name", () => {
      const result = registry.validateTemplateName("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Template name is required");
    });

    it("should return error for non-existing template", () => {
      const result = registry.validateTemplateName("non-existent");
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Template "non-existent" not found');
    });
  });

  describe("searchByTags", () => {
    beforeEach(() => {
      registry.clearTemplates();
      registry.addTemplate({
        name: "template1",
        description: "Template 1",
        repository: "repo1",
        tags: ["react", "typescript"],
      });
      registry.addTemplate({
        name: "template2",
        description: "Template 2",
        repository: "repo2",
        tags: ["node", "typescript"],
      });
      registry.addTemplate({
        name: "template3",
        description: "Template 3",
        repository: "repo3",
        tags: ["vue", "javascript"],
      });
    });

    it("should return templates matching any tag", () => {
      const results = registry.searchByTags(["typescript"]);
      expect(results.length).toBe(2);
      expect(results.map((t) => t.name)).toContain("template1");
      expect(results.map((t) => t.name)).toContain("template2");
    });

    it("should return templates matching multiple tags", () => {
      const results = registry.searchByTags(["react", "node"]);
      expect(results.length).toBe(2);
    });

    it("should return empty array if no matches", () => {
      const results = registry.searchByTags(["python"]);
      expect(results).toEqual([]);
    });

    it("should return all templates if tags array is empty", () => {
      const results = registry.searchByTags([]);
      expect(results.length).toBe(3);
    });

    it("should handle templates without tags", () => {
      registry.addTemplate({
        name: "no-tags",
        description: "No tags",
        repository: "repo",
      });
      const results = registry.searchByTags(["typescript"]);
      expect(results.map((t) => t.name)).not.toContain("no-tags");
    });
  });

  describe("getTemplateChoices", () => {
    it("should return formatted choices for prompts", () => {
      const choices = registry.getTemplateChoices();
      expect(Array.isArray(choices)).toBe(true);
      expect(choices.length).toBeGreaterThan(0);

      const vibeReactChoice = choices.find((c) => c.value === "vibe-react");
      expect(vibeReactChoice).toBeDefined();
      expect(vibeReactChoice?.title).toBe("vibe-react");
      expect(vibeReactChoice?.description).toBeDefined();
    });
  });

  describe("removeTemplate", () => {
    it("should remove existing template", () => {
      registry.addTemplate({
        name: "to-remove",
        description: "Template to remove",
        repository: "repo",
      });

      expect(registry.hasTemplate("to-remove")).toBe(true);
      const removed = registry.removeTemplate("to-remove");
      expect(removed).toBe(true);
      expect(registry.hasTemplate("to-remove")).toBe(false);
    });

    it("should return false when removing non-existing template", () => {
      const removed = registry.removeTemplate("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("clearTemplates", () => {
    it("should remove all templates", () => {
      expect(registry.getTemplateCount()).toBeGreaterThan(0);
      registry.clearTemplates();
      expect(registry.getTemplateCount()).toBe(0);
    });
  });

  describe("getTemplateCount", () => {
    it("should return correct template count", () => {
      registry.clearTemplates();
      expect(registry.getTemplateCount()).toBe(0);

      registry.addTemplate({
        name: "template1",
        description: "Template 1",
        repository: "repo1",
      });
      expect(registry.getTemplateCount()).toBe(1);

      registry.addTemplate({
        name: "template2",
        description: "Template 2",
        repository: "repo2",
      });
      expect(registry.getTemplateCount()).toBe(2);
    });
  });

  describe("loadTemplateConfig", () => {
    it("should return basic config for existing template", async () => {
      const config = await registry.loadTemplateConfig("vibe-react");
      expect(config).toBeDefined();
      expect(config?.name).toBe("vibe-react");
      expect(config?.repository).toBeDefined();
    });

    it("should return null for non-existing template", async () => {
      const config = await registry.loadTemplateConfig("non-existent");
      expect(config).toBeNull();
    });
  });
});

describe("Template Registry convenience functions", () => {
  // Reset module before testing to ensure clean state
  beforeEach(() => {
    vi.resetModules();
  });

  it("should export working convenience functions", async () => {
    const {
      getTemplate,
      getAllTemplates,
      getTemplateNames,
      hasTemplate,
      validateTemplateName,
      getTemplateChoices,
    } = await import("./template-registry.js");

    // Test convenience functions work with singleton
    expect(hasTemplate("vibe-react")).toBe(true);
    expect(getTemplate("vibe-react")).toBeDefined();
    expect(getAllTemplates().length).toBeGreaterThan(0);
    expect(getTemplateNames()).toContain("vibe-react");
    expect(validateTemplateName("vibe-react").valid).toBe(true);
    expect(getTemplateChoices().length).toBeGreaterThan(0);
  });
});
