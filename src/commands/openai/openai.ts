import { Command } from "commander";
import OpenAI from "openai";
import fs from "node:fs/promises";
import process from "node:process";
import { createLogger } from "../../utils/logger.js";

type OpenaiOptions = {
  readonly model?: string;
  readonly system?: string;
  readonly systemFile?: string;
  readonly user?: string;
  readonly userFile?: string;
  readonly jsonSchema?: string;
  readonly jsonSchemaFile?: string;
  readonly format?: "raw" | "json" | "pretty";
  readonly verbose?: boolean;
  readonly timeout?: number;
  readonly maxTokens?: number;
  readonly temperature?: number;
};

/**
 * Read content from a file if path is provided, otherwise return the string
 */
async function readPromptContent(content?: string, filePath?: string): Promise<string | undefined> {
  if (filePath) {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return content;
}

/**
 * Validate and get API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Error: OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }
  return apiKey;
}

/**
 * Parse JSON schema from string content
 */
function parseJsonSchema(schemaContent: string): Record<string, unknown> {
  try {
    return JSON.parse(schemaContent) as Record<string, unknown>;
  } catch (error) {
    console.error(
      `Error: Invalid JSON schema: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

/**
 * Prepare messages array for OpenAI API
 */
function prepareMessages(
  systemPrompt?: string,
  userPrompt?: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  if (!userPrompt) {
    console.error("Error: User prompt is required (use --user or --user-file)");
    process.exit(1);
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: userPrompt,
  });

  return messages;
}

/**
 * Prepare request parameters for OpenAI API
 */
function prepareRequestParams(
  options: OpenaiOptions,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  jsonSchema?: Record<string, unknown>
): OpenAI.Chat.Completions.ChatCompletionCreateParams {
  const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
    model: options.model || "gpt-4o-mini",
    messages,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7,
  };

  if (jsonSchema) {
    requestParams.response_format = {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema: jsonSchema,
      },
    };
  }

  return requestParams;
}

/**
 * Format and output the response
 */
function formatOutput(
  response: string,
  format: string = "pretty",
  hasJsonSchema: boolean = false
): void {
  switch (format) {
    case "raw":
      console.log(response);
      break;
    case "json":
      if (hasJsonSchema) {
        console.log(response);
      } else {
        console.log(JSON.stringify({ response }, null, 0));
      }
      break;
    case "pretty":
    default:
      if (hasJsonSchema) {
        try {
          const parsed = JSON.parse(response);
          console.log(JSON.stringify(parsed, null, 2));
        } catch {
          console.log(response);
        }
      } else {
        console.log(response);
      }
      break;
  }
}

/**
 * Handle API errors with appropriate logging
 */
function handleApiError(error: unknown, verbose: boolean = false): void {
  if (error instanceof OpenAI.APIError) {
    console.error(`OpenAI API Error: ${error.message}`);
    if (verbose) {
      const logger = createLogger();
      logger.error("API Error Details", {
        status: error.status,
        code: error.code,
        type: error.type,
      });
    }
  } else {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
}

/**
 * Execute the OpenAI command
 */
async function executeOpenaiCommand(options: OpenaiOptions): Promise<void> {
  const logger = createLogger();
  const apiKey = getApiKey();

  const openai = new OpenAI({
    apiKey,
    timeout: options.timeout ? options.timeout * 1000 : 30000,
  });

  try {
    const systemPrompt = await readPromptContent(options.system, options.systemFile);
    const userPrompt = await readPromptContent(options.user, options.userFile);

    let jsonSchema: Record<string, unknown> | undefined;
    if (options.jsonSchema || options.jsonSchemaFile) {
      const schemaContent = await readPromptContent(options.jsonSchema, options.jsonSchemaFile);
      if (schemaContent) {
        jsonSchema = parseJsonSchema(schemaContent);
      }
    }

    const messages = prepareMessages(systemPrompt, userPrompt);
    const requestParams = prepareRequestParams(options, messages, jsonSchema);

    if (options.verbose) {
      logger.info("Making OpenAI API request", {
        model: requestParams.model,
        maxTokens: requestParams.max_tokens,
        temperature: requestParams.temperature,
        hasSystemPrompt: !!systemPrompt,
        hasJsonSchema: !!jsonSchema,
      });
    }

    const completion = await openai.chat.completions.create({
      ...requestParams,
      stream: false,
    });
    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.error("Error: No response from OpenAI API");
      process.exit(1);
    }

    formatOutput(response, options.format, !!jsonSchema);

    if (options.verbose) {
      logger.info("Request completed", {
        usage: completion.usage,
        model: completion.model,
        finishReason: completion.choices[0]?.finish_reason,
      });
    }
  } catch (error) {
    handleApiError(error, options.verbose);
  }
}

/**
 * Create the openai command
 */
export function openaiCommand(): Command {
  const command = new Command("openai");

  command
    .description(
      "Prompt OpenAI/ChatGPT with support for system prompts, structured responses, and file inputs"
    )
    .option("-m, --model <model>", "OpenAI model to use", "gpt-4o-mini")
    .option("-s, --system <prompt>", "System prompt text")
    .option("--system-file <path>", "Path to file containing system prompt")
    .option("-u, --user <prompt>", "User prompt text")
    .option("--user-file <path>", "Path to file containing user prompt")
    .option("--json-schema <schema>", "JSON schema for structured response")
    .option("--json-schema-file <path>", "Path to file containing JSON schema")
    .option("-f, --format <format>", "Output format (raw, json, pretty)", "pretty")
    .option("-v, --verbose", "Verbose output for debugging")
    .option("-t, --timeout <seconds>", "Request timeout in seconds", "30")
    .option("--max-tokens <tokens>", "Maximum tokens in response", "2048")
    .option("--temperature <temp>", "Response temperature (0.0-2.0)", "0.7")
    .action(async (options: OpenaiOptions) => {
      await executeOpenaiCommand(options);
    });

  return command;
}
