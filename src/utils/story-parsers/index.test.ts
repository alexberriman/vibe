import { describe, expect, it, vi, beforeEach } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import { createStoryParser, parseStoryFiles } from "./index.js";
import { TypeScriptStoryParser } from "./typescript-parser.js";
import { JavaScriptStoryParser } from "./javascript-parser.js";

describe("Story Parser Factory", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(fs, "readFile").mockResolvedValue(
      "export default {}; export const Primary = () => {};"
    );
  });

  describe("createStoryParser", () => {
    it("should create TypeScript parser for .tsx files", () => {
      const parser = createStoryParser({
        filePath: path.join("path", "to", "Button.stories.tsx"),
      });

      expect(parser).toBeInstanceOf(TypeScriptStoryParser);
    });

    it("should create TypeScript parser for .ts files", () => {
      const parser = createStoryParser({
        filePath: path.join("path", "to", "Button.stories.ts"),
      });

      expect(parser).toBeInstanceOf(TypeScriptStoryParser);
    });

    it("should create JavaScript parser for .jsx files", () => {
      const parser = createStoryParser({
        filePath: path.join("path", "to", "Button.stories.jsx"),
      });

      expect(parser).toBeInstanceOf(JavaScriptStoryParser);
    });

    it("should create JavaScript parser for .js files", () => {
      const parser = createStoryParser({
        filePath: path.join("path", "to", "Button.stories.js"),
      });

      expect(parser).toBeInstanceOf(JavaScriptStoryParser);
    });

    it("should create JavaScript parser for .mdx files temporarily", () => {
      const parser = createStoryParser({
        filePath: path.join("path", "to", "Button.stories.mdx"),
      });

      expect(parser).toBeInstanceOf(JavaScriptStoryParser);
    });

    it("should throw an error for unsupported file types", () => {
      expect(() =>
        createStoryParser({
          filePath: path.join("path", "to", "Button.stories.unknown"),
        })
      ).toThrow("Unsupported file type");
    });
  });

  describe("parseStoryFiles", () => {
    it("should parse multiple story files and combine results", async () => {
      // Mock different file contents for different files
      vi.spyOn(fs, "readFile").mockImplementation((filePath) => {
        if (String(filePath).includes("Button.stories.tsx")) {
          return Promise.resolve(`
            export default { title: "Components/Button" };
            export const Primary = () => {};
            export const Secondary = () => {};
          `);
        }
        if (String(filePath).includes("Input.stories.jsx")) {
          return Promise.resolve(`
            export default { title: "Components/Input" };
            export const Text = () => {};
            export const Number = () => {};
          `);
        }
        return Promise.resolve("");
      });

      const stories = await parseStoryFiles({
        filePaths: [
          path.join("path", "to", "Button.stories.tsx"),
          path.join("path", "to", "Input.stories.jsx"),
        ],
        logger: { error: vi.fn() } as unknown as import("pino").Logger,
      });

      // Should have 4 stories in total
      expect(stories).toHaveLength(4);

      // Check component names
      const componentNames = stories.map((story) => story.componentName);
      expect(componentNames).toContain("Button");
      expect(componentNames).toContain("Input");

      // Check story names
      const storyNames = stories.map((story) => story.name);
      expect(storyNames).toContain("Primary");
      expect(storyNames).toContain("Secondary");
      expect(storyNames).toContain("Text");
      expect(storyNames).toContain("Number");
    });

    it("should continue parsing other files if one file fails", async () => {
      // Mock success for one file and error for another
      vi.spyOn(fs, "readFile").mockImplementation((filePath) => {
        if (String(filePath).includes("Button.stories.tsx")) {
          return Promise.resolve(`
            export default { title: "Components/Button" };
            export const Primary = () => {};
          `);
        }
        if (String(filePath).includes("Error.stories.jsx")) {
          return Promise.reject(new Error("File not found"));
        }
        return Promise.resolve("");
      });

      const mockLogger = { error: vi.fn() };

      const stories = await parseStoryFiles({
        filePaths: [
          path.join("path", "to", "Button.stories.tsx"),
          path.join("path", "to", "Error.stories.jsx"),
        ],
        logger: mockLogger as unknown as import("pino").Logger,
      });

      // Should have stories from the successful parse
      expect(stories).toHaveLength(1);
      expect(stories[0].componentName).toBe("Button");

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
