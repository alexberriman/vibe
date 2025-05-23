import prompts from "prompts";
import type { PromptObject } from "prompts";
import { simpleGit } from "simple-git";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { templateRegistry } from "./template-registry.js";

export interface ScaffoldPromptAnswers {
  template: string;
  projectName: string;
  description: string;
  authorName: string;
  authorEmail: string;
  outputDirectory: string;
  confirmOverwrite?: boolean;
}

// Validate npm package name
export function isValidPackageName(name: string): boolean {
  // NPM package name rules
  const pattern = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  return pattern.test(name) && name.length <= 214;
}

// Get git config values
async function getGitConfig(key: string): Promise<string | null> {
  try {
    const git = simpleGit();
    const value = await git.getConfig(key);
    return value.value || null;
  } catch {
    return null;
  }
}

// Check if directory exists
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// Create template selection prompt
export function createTemplatePrompt(): PromptObject {
  const templateChoices = templateRegistry.getTemplateChoices();
  return {
    type: "select",
    name: "template",
    message: "Select a project template",
    choices: templateChoices.map((choice) => ({
      title: `${choice.title} - ${choice.description}`,
      value: choice.value,
    })),
  };
}

// Create project name prompt
export function createProjectNamePrompt(initialValue?: string): PromptObject {
  return {
    type: "text",
    name: "projectName",
    message: "Project name",
    initial: initialValue || "my-project",
    validate: (value: string) => {
      if (!value) return "Project name is required";
      if (!isValidPackageName(value)) {
        return "Invalid project name. Must be lowercase, can contain hyphens, and follow npm naming rules";
      }
      return true;
    },
  };
}

// Create description prompt
export function createDescriptionPrompt(): PromptObject {
  return {
    type: "text",
    name: "description",
    message: "Project description",
    initial: "A new project",
  };
}

// Create author name prompt
export function createAuthorNamePrompt(gitName: string | null): PromptObject {
  return {
    type: "text",
    name: "authorName",
    message: "Author name",
    initial: gitName || "",
  };
}

// Create author email prompt
export function createAuthorEmailPrompt(gitEmail: string | null): PromptObject {
  return {
    type: "text",
    name: "authorEmail",
    message: "Author email",
    initial: gitEmail || "",
  };
}

// Create output directory prompt
export function createOutputDirectoryPrompt(projectName: string): PromptObject {
  return {
    type: "text",
    name: "outputDirectory",
    message: "Output directory",
    initial: path.join(process.cwd(), projectName),
  };
}

// Create overwrite confirmation prompt
export function createOverwritePrompt(directory: string): PromptObject {
  return {
    type: "confirm",
    name: "confirmOverwrite",
    message: `Directory ${directory} already exists. Overwrite?`,
    initial: false,
  };
}

// Run interactive prompts
export async function runInteractivePrompts(
  options: Partial<ScaffoldPromptAnswers>
): Promise<ScaffoldPromptAnswers | null> {
  const gitName = await getGitConfig("user.name");
  const gitEmail = await getGitConfig("user.email");

  const questions: PromptObject[] = [];

  // Template selection (if not provided)
  if (!options.template) {
    questions.push(createTemplatePrompt());
  }

  // Project details
  questions.push(createProjectNamePrompt(options.projectName), createDescriptionPrompt());

  // Author information
  if (!options.authorName) {
    questions.push(createAuthorNamePrompt(gitName));
  }

  if (!options.authorEmail) {
    questions.push(createAuthorEmailPrompt(gitEmail));
  }

  // Run initial prompts
  const initialAnswers = await prompts(questions, {
    onCancel: () => {
      return false;
    },
  });

  // Check if user cancelled
  if (!initialAnswers.projectName) {
    return null;
  }

  // Output directory prompt (needs project name)
  const outputDirQuestion = createOutputDirectoryPrompt(
    initialAnswers.projectName || options.projectName || "my-project"
  );

  const dirAnswer = await prompts(outputDirQuestion, {
    onCancel: () => {
      return false;
    },
  });

  if (!dirAnswer.outputDirectory) {
    return null;
  }

  // Check if directory exists and prompt for overwrite if needed
  const outputPath = path.resolve(dirAnswer.outputDirectory);
  const dirExists = await directoryExists(outputPath);

  let confirmOverwrite = true;
  if (dirExists && !options.confirmOverwrite) {
    const overwriteAnswer = await prompts(createOverwritePrompt(outputPath), {
      onCancel: () => {
        return false;
      },
    });

    if (overwriteAnswer.confirmOverwrite === undefined) {
      return null;
    }

    confirmOverwrite = overwriteAnswer.confirmOverwrite;
  }

  // Combine all answers
  return {
    template: options.template || initialAnswers.template,
    projectName: initialAnswers.projectName || options.projectName || "",
    description: initialAnswers.description || options.description || "",
    authorName: initialAnswers.authorName || options.authorName || gitName || "",
    authorEmail: initialAnswers.authorEmail || options.authorEmail || gitEmail || "",
    outputDirectory: outputPath,
    confirmOverwrite,
  };
}

// Get template info by name
export function getTemplateInfo(name: string): ReturnType<typeof templateRegistry.getTemplate> {
  return templateRegistry.getTemplate(name);
}

// Get all available templates
export function getAllTemplates(): ReturnType<typeof templateRegistry.getAllTemplates> {
  return templateRegistry.getAllTemplates();
}
