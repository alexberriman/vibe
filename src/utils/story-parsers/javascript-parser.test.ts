import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import { JavaScriptStoryParser } from "./javascript-parser.js";

// Mock the fs module
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("JavaScriptStoryParser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should extract stories from JavaScript CSF format", async () => {
    // Mock file content for a JavaScript CSF story
    const mockFileContent = `
      import React from "react";
      import { Button } from "./button";
      
      export default {
        title: "Components/Button",
        component: Button,
      };
      
      export const Primary = () => <Button>Primary</Button>;
      export const Secondary = () => <Button variant="secondary">Secondary</Button>;
      export const Large = () => <Button size="large">Large</Button>;
    `;

    // Mock the readFile function
    vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

    // Create parser instance
    const parser = new JavaScriptStoryParser({
      filePath: "/path/to/Button.stories.jsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    // Parse the file
    const stories = await parser.parse();

    // Expectations
    expect(stories).toHaveLength(3);
    expect(stories[0].name).toBe("Primary");
    expect(stories[0].componentName).toBe("Button");
    expect(stories[0].id).toBe("button--primary");
    expect(stories[0].title).toBe("Components/Button");

    expect(stories[1].name).toBe("Secondary");
    expect(stories[2].name).toBe("Large");
  });

  it("should handle story files with no story exports", async () => {
    // Mock file content with no story exports
    const mockFileContent = `
      import React from "react";
      import { Button } from "./button";
      
      export default {
        title: "Components/Button",
        component: Button,
      };
    `;

    vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

    const parser = new JavaScriptStoryParser({
      filePath: "/path/to/EmptyStories.stories.jsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    const stories = await parser.parse();

    // Should create a default "Primary" story
    expect(stories).toHaveLength(1);
    expect(stories[0].name).toBe("Primary");
    expect(stories[0].componentName).toBe("EmptyStories");
  });

  it("should format story names from camelCase and PascalCase", async () => {
    const mockFileContent = `
      import React from "react";
      import { Button } from "./button";
      
      export default {
        title: "Components/Button",
        component: Button,
      };
      
      export const primaryButton = () => <Button>Primary</Button>;
      export const SecondaryLargeButton = () => <Button variant="secondary" size="large">Secondary Large</Button>;
    `;

    vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

    const parser = new JavaScriptStoryParser({
      filePath: "/path/to/Button.stories.jsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    const stories = await parser.parse();

    expect(stories).toHaveLength(2);
    expect(stories[0].name).toBe("Primary Button");
    expect(stories[1].name).toBe("Secondary Large Button");
  });

  it("should handle errors gracefully and return a default story", async () => {
    // Mock an error during file reading
    vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

    const mockLogger = { error: vi.fn() };

    const parser = new JavaScriptStoryParser({
      filePath: "/path/to/Button.stories.jsx",
      logger: mockLogger as unknown as import("pino").Logger,
    });

    const stories = await parser.parse();

    // Should return a default story
    expect(stories).toHaveLength(1);
    expect(stories[0].name).toBe("Primary");
    expect(stories[0].componentName).toBe("Button");

    // Should log the error
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
