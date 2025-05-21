import type { Logger } from "pino";
import { createLogger } from "../logger.js";
import {
  isJavaScriptStory,
  isTypeScriptStory,
  isMdxStory,
  type StoryMetadata,
} from "./shared-parser.js";
import { TypeScriptStoryParser } from "./typescript-parser.js";
import { JavaScriptStoryParser } from "./javascript-parser.js";

/**
 * Interface for story parsers
 */
export interface StoryParser {
  parse(): Promise<StoryMetadata[]>;
}

/**
 * Parser factory options
 */
export interface ParserFactoryOptions {
  readonly filePath: string;
  readonly logger?: Logger;
}

/**
 * Create a story parser based on file extension
 */
export function createStoryParser({
  filePath,
  logger = createLogger(),
}: ParserFactoryOptions): StoryParser {
  if (isTypeScriptStory(filePath)) {
    return new TypeScriptStoryParser({ filePath, logger });
  }

  if (isJavaScriptStory(filePath)) {
    return new JavaScriptStoryParser({ filePath, logger });
  }

  if (isMdxStory(filePath)) {
    // For now, handle MDX files with the JavaScript parser
    // This would be replaced with a proper MDX parser in the future
    return new JavaScriptStoryParser({ filePath, logger });
  }

  throw new Error(`Unsupported file type for story parsing: ${filePath}`);
}

/**
 * Parse multiple story files and return all stories
 */
export async function parseStoryFiles({
  filePaths,
  logger = createLogger(),
}: {
  readonly filePaths: string[];
  readonly logger?: Logger;
}): Promise<StoryMetadata[]> {
  const allStories: StoryMetadata[] = [];

  for (const filePath of filePaths) {
    try {
      const parser = createStoryParser({ filePath, logger });
      const stories = await parser.parse();
      allStories.push(...stories);
    } catch (error) {
      logger.error(`Failed to parse story file: ${filePath}`);
      if (error instanceof Error) {
        logger.error(error.message);
      }
      // Continue with the next file
    }
  }

  return allStories;
}

export type { StoryMetadata } from "./shared-parser.js";
