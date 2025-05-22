import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import { TypeScriptStoryParser } from "./typescript-parser.js";

describe("TypeScriptStoryParser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should extract stories from TypeScript CSF format", async () => {
    // Mock file content for a TypeScript CSF story
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
    vi.spyOn(fs, "readFile").mockResolvedValue(mockFileContent);

    // Create parser instance
    const parser = new TypeScriptStoryParser({
      filePath: "/path/to/Button.stories.tsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    // Parse the file
    const stories = await parser.parse();

    // Expectations
    expect(stories).toHaveLength(3);
    expect(stories[0].name).toBe("Primary");
    expect(stories[0].componentName).toBe("Button");
    expect(stories[0].id).toBe("components-button--primary");
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

    vi.spyOn(fs, "readFile").mockResolvedValue(mockFileContent);

    const parser = new TypeScriptStoryParser({
      filePath: "/path/to/EmptyStories.stories.tsx",
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

    vi.spyOn(fs, "readFile").mockResolvedValue(mockFileContent);

    const parser = new TypeScriptStoryParser({
      filePath: "/path/to/Button.stories.tsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    const stories = await parser.parse();

    expect(stories).toHaveLength(2);
    expect(stories[0].name).toBe("Primary Button");
    expect(stories[1].name).toBe("Secondary Large Button");
  });

  it("should handle errors gracefully and return a default story", async () => {
    // Mock file content will throw an error during parsing
    const fileContent = "this is not valid TypeScript";
    vi.spyOn(fs, "readFile").mockResolvedValue(fileContent);

    const mockLogger = { error: vi.fn() };

    const parser = new TypeScriptStoryParser({
      filePath: "/path/to/Button.stories.tsx",
      logger: mockLogger as unknown as import("pino").Logger,
    });

    // Create a type that includes the private methods for testing purposes
    type TypeScriptStoryParserWithPrivates = TypeScriptStoryParser & {
      extractStoryExports: (_content: string) => Array<{ name: string }>;
    };

    // Mock a method called by parse to force an error
    vi.spyOn(parser as TypeScriptStoryParserWithPrivates, "extractStoryExports").mockImplementation(
      () => {
        throw new Error("Failed to parse");
      }
    );

    const stories = await parser.parse();

    // Should return a default story
    expect(stories).toHaveLength(1);
    expect(stories[0].name).toBe("Primary");
    expect(stories[0].componentName).toBe("Button");

    // Should log the error
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("should handle stories without title and fallback to component name", async () => {
    const mockFileContent = `
      import React from "react";
      import { Button } from "./button";
      
      export default {
        component: Button,
      };
      
      export const Primary = () => <Button>Primary</Button>;
      export const Secondary = () => <Button variant="secondary">Secondary</Button>;
    `;

    vi.spyOn(fs, "readFile").mockResolvedValue(mockFileContent);

    const parser = new TypeScriptStoryParser({
      filePath: "/path/to/Button.stories.tsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    const stories = await parser.parse();

    expect(stories).toHaveLength(2);
    expect(stories[0].name).toBe("Primary");
    expect(stories[0].componentName).toBe("Button");
    expect(stories[0].id).toBe("button--primary"); // Should fallback to component name
    expect(stories[0].title).toBe(""); // No title
  });

  it("should handle nested story categories correctly", async () => {
    const mockFileContent = `
      import React from "react";
      import { Radio } from "./radio";
      
      export default {
        title: "Forms/Radio",
        component: Radio,
      };
      
      export const Default = () => <Radio>Default</Radio>;
      export const Checked = () => <Radio checked>Checked</Radio>;
    `;

    vi.spyOn(fs, "readFile").mockResolvedValue(mockFileContent);

    const parser = new TypeScriptStoryParser({
      filePath: "/path/to/Radio.stories.tsx",
      logger: { error: vi.fn() } as unknown as import("pino").Logger,
    });

    const stories = await parser.parse();

    expect(stories).toHaveLength(2);
    expect(stories[0].name).toBe("Default");
    expect(stories[0].componentName).toBe("Radio");
    expect(stories[0].id).toBe("forms-radio--default");
    expect(stories[0].title).toBe("Forms/Radio");

    expect(stories[1].name).toBe("Checked");
    expect(stories[1].id).toBe("forms-radio--checked");
  });
});
