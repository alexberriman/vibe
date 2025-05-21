import { describe, expect, it } from "vitest";
import path from "node:path";
import { isMdxStory, isTypeScriptStory, isJavaScriptStory } from "./shared-parser.js";

describe("shared-parser", () => {
  describe("file type detection", () => {
    it("should detect MDX stories correctly", () => {
      expect(isMdxStory(path.join("path", "to", "Button.stories.mdx"))).toBe(true);
      expect(isMdxStory(path.join("path", "to", "Button.stories.tsx"))).toBe(false);
      expect(isMdxStory(path.join("path", "to", "Button.stories.jsx"))).toBe(false);
    });

    it("should detect TypeScript stories correctly", () => {
      expect(isTypeScriptStory(path.join("path", "to", "Button.stories.tsx"))).toBe(true);
      expect(isTypeScriptStory(path.join("path", "to", "Button.stories.ts"))).toBe(true);
      expect(isTypeScriptStory(path.join("path", "to", "Button.stories.jsx"))).toBe(false);
      expect(isTypeScriptStory(path.join("path", "to", "Button.stories.js"))).toBe(false);
      expect(isTypeScriptStory(path.join("path", "to", "Button.stories.mdx"))).toBe(false);
    });

    it("should detect JavaScript stories correctly", () => {
      expect(isJavaScriptStory(path.join("path", "to", "Button.stories.jsx"))).toBe(true);
      expect(isJavaScriptStory(path.join("path", "to", "Button.stories.js"))).toBe(true);
      expect(isJavaScriptStory(path.join("path", "to", "Button.stories.tsx"))).toBe(false);
      expect(isJavaScriptStory(path.join("path", "to", "Button.stories.ts"))).toBe(false);
      expect(isJavaScriptStory(path.join("path", "to", "Button.stories.mdx"))).toBe(false);
    });
  });
});
