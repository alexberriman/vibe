import { BaseStoryParser, type ParserOptions, type StoryMetadata } from "./shared-parser.js";

/**
 * Parser for JavaScript story files
 */
export class JavaScriptStoryParser extends BaseStoryParser {
  constructor(options: ParserOptions) {
    super(options);
  }

  /**
   * Parse the JavaScript story file to extract story metadata
   */
  async parse(): Promise<StoryMetadata[]> {
    // Read the file content if not already loaded
    if (!this.fileContent) {
      await this.readFile();
    }

    const content = this.fileContent;
    const stories: StoryMetadata[] = [];
    const componentName = this.extractComponentNameFromPath();

    try {
      // Extract default export meta (for title/component info)
      const defaultExportMatch = content.match(/export\s+default\s+({[^}]*}|{[\s\S]*?^})/m);

      const metaTitle = defaultExportMatch
        ? this.extractValueFromMatch(defaultExportMatch[1], "title")
        : "";

      // Try to extract displayName for component
      const displayNameMatch = content.match(
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\.displayName\s*=\s*["']([^"']+)["']/
      );
      const displayName = displayNameMatch ? displayNameMatch[2] : undefined;

      // Extract story exports
      const storyMatches = this.extractStoryExports(content);

      for (const match of storyMatches) {
        const storyName = match.name;
        const formattedName = this.formatStoryName(storyName);

        stories.push({
          id: this.generateStoryId(componentName, formattedName),
          name: formattedName,
          componentName,
          displayName,
          title: metaTitle,
          filePath: this.filePath,
        });
      }

      // If no stories were found but it's a story file, create a default one
      if (stories.length === 0) {
        stories.push({
          id: this.generateStoryId(componentName, "primary"),
          name: "Primary",
          componentName,
          displayName,
          title: metaTitle,
          filePath: this.filePath,
        });
      }

      return stories;
    } catch (error) {
      this.logger.error(`Failed to parse JavaScript story file: ${this.filePath}`);
      if (error instanceof Error) {
        this.logger.error(error.message);
      }

      // Return a default story on error
      return [
        {
          id: this.generateStoryId(componentName, "primary"),
          name: "Primary",
          componentName,
          filePath: this.filePath,
        },
      ];
    }
  }

  /**
   * Extract story exports from the file content
   */
  private extractStoryExports(content: string): Array<{ name: string }> {
    const stories: Array<{ name: string }> = [];

    // Pattern for export const StoryName = ...
    const storyExportPattern = /export\s+const\s+(\w+)(?:\s*=\s*|\s*:\s*)/g;
    let match;

    while ((match = storyExportPattern.exec(content)) !== null) {
      const storyName = match[1];

      // Skip if it's the "default" export or metadata
      if (storyName !== "default" && storyName !== "meta" && !storyName.includes("Meta")) {
        stories.push({ name: storyName });
      }
    }

    return stories;
  }

  /**
   * Format story name from camelCase or PascalCase to Title Case
   */
  private formatStoryName(name: string): string {
    // Handle PascalCase or camelCase conversion to Title Case with spaces
    return (
      name
        // Insert space before uppercase letters that follow lowercase
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        // Ensure first character is uppercase
        .replace(/^./, (str) => str.toUpperCase())
    );
  }

  /**
   * Extract a property value from an object-like string
   */
  private extractValueFromMatch(match: string, property: string): string {
    const propRegex = new RegExp(`${property}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`);
    const propMatch = match.match(propRegex);
    return propMatch ? propMatch[1] : "";
  }
}
