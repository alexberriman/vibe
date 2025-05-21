import fs from "node:fs/promises";
import path from "node:path";
import type { Logger } from "pino";
import { createLogger } from "../logger.js";
import type { StoryParser } from "./index.js";

/**
 * Story metadata interface representing a parsed Storybook story
 */
export interface StoryMetadata {
  readonly id: string;
  readonly name: string;
  readonly componentName: string;
  readonly displayName?: string;
  readonly title?: string;
  readonly filePath: string;
}

/**
 * Base options for story parsing
 */
export interface ParserOptions {
  readonly filePath: string;
  readonly logger?: Logger;
}

/**
 * Base parser class with shared functionality
 */
export abstract class BaseStoryParser implements StoryParser {
  protected filePath: string;
  protected logger: Logger;
  protected fileContent: string = "";

  constructor({ filePath, logger = createLogger() }: ParserOptions) {
    this.filePath = filePath;
    this.logger = logger;
  }

  /**
   * Read the file content
   */
  async readFile(): Promise<string> {
    try {
      this.fileContent = await fs.readFile(this.filePath, "utf-8");
      return this.fileContent;
    } catch (error) {
      this.logger.error(`Failed to read file: ${this.filePath}`);
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      throw error;
    }
  }

  /**
   * Extract the component name from the file path
   */
  protected extractComponentNameFromPath(): string {
    const fileName = path.basename(this.filePath);
    // Remove file extension and .stories suffix
    return fileName.replace(/\.stories\.(tsx|jsx|ts|js|mdx)$/, "");
  }

  /**
   * Generate a story ID from component name and story name
   */
  protected generateStoryId(componentName: string, storyName: string): string {
    const sanitizedComponentName = componentName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const sanitizedStoryName = storyName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    return `${sanitizedComponentName}--${sanitizedStoryName}`;
  }

  /**
   * Parse the story file to extract story metadata
   */
  abstract parse(): Promise<StoryMetadata[]>;
}

/**
 * Determine if the file is an MDX story
 */
export function isMdxStory(filePath: string): boolean {
  return filePath.endsWith(".mdx");
}

/**
 * Determine if the file is a TypeScript story
 */
export function isTypeScriptStory(filePath: string): boolean {
  return filePath.endsWith(".tsx") || filePath.endsWith(".ts");
}

/**
 * Determine if the file is a JavaScript story
 */
export function isJavaScriptStory(filePath: string): boolean {
  return filePath.endsWith(".jsx") || filePath.endsWith(".js");
}
