import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TemplateProcessor } from "./template-processor.js";
import type { ScaffoldPromptAnswers } from "./prompts.js";
import type { TemplateConfig } from "./template-registry.js";

describe("TemplateProcessor", () => {
  let processor: TemplateProcessor;
  let tempDir: string;
  let sourceDir: string;
  let targetDir: string;

  beforeEach(async () => {
    processor = new TemplateProcessor();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "template-processor-test-"));
    sourceDir = path.join(tempDir, "source");
    targetDir = path.join(tempDir, "target");
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should replace placeholders in text files", async () => {
    // Create a template file with placeholders
    const templateContent = `# {{projectName}}

{{description}}

Author: {{authorName}} <{{authorEmail}}>
Year: {{year}}`;

    await fs.writeFile(path.join(sourceDir, "README.md"), templateContent);

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "my-awesome-project",
      description: "An awesome project",
      authorName: "John Doe",
      authorEmail: "john@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const processedContent = await fs.readFile(path.join(targetDir, "README.md"), "utf-8");
    const currentYear = new Date().getFullYear().toString();

    expect(processedContent).toContain("# my-awesome-project");
    expect(processedContent).toContain("An awesome project");
    expect(processedContent).toContain("Author: John Doe <john@example.com>");
    expect(processedContent).toContain(`Year: ${currentYear}`);
  });

  it("should process package.json specially", async () => {
    const packageJson = {
      name: "{{projectName}}",
      version: "1.0.0",
      description: "{{description}}",
      author: "{{authorName}} <{{authorEmail}}>",
    };

    await fs.writeFile(path.join(sourceDir, "package.json"), JSON.stringify(packageJson, null, 2));

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "my-project",
      description: "My test project",
      authorName: "Jane Doe",
      authorEmail: "jane@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const processedPackageJson = JSON.parse(
      await fs.readFile(path.join(targetDir, "package.json"), "utf-8")
    );

    expect(processedPackageJson.name).toBe("my-project");
    expect(processedPackageJson.version).toBe("0.1.0"); // Should be reset to 0.1.0
    expect(processedPackageJson.description).toBe("My test project");
    expect(processedPackageJson.author).toBe("Jane Doe <jane@example.com>");
  });

  it("should copy binary files without processing", async () => {
    // Create a fake binary file (with null bytes)
    const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    await fs.writeFile(path.join(sourceDir, "image.png"), binaryData);

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "my-project",
      description: "Test project",
      authorName: "Test",
      authorEmail: "test@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const copiedData = await fs.readFile(path.join(targetDir, "image.png"));
    expect(copiedData).toEqual(binaryData);
  });

  it("should handle nested directories", async () => {
    // Create nested structure
    await fs.mkdir(path.join(sourceDir, "src", "components"), { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, "src", "components", "App.tsx"),
      "// {{projectName}} App Component"
    );

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "nested-project",
      description: "Test project",
      authorName: "Test",
      authorEmail: "test@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const processedContent = await fs.readFile(
      path.join(targetDir, "src", "components", "App.tsx"),
      "utf-8"
    );
    expect(processedContent).toBe("// nested-project App Component");
  });

  it("should use custom placeholders from config", async () => {
    await fs.writeFile(path.join(sourceDir, "config.js"), "export const API_URL = '{{apiUrl}}';");

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "custom-project",
      description: "Test project",
      authorName: "Test",
      authorEmail: "test@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
      placeholders: {
        apiUrl: "https://api.example.com",
      },
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const processedContent = await fs.readFile(path.join(targetDir, "config.js"), "utf-8");
    expect(processedContent).toBe("export const API_URL = 'https://api.example.com';");
  });

  it("should handle dry-run mode", async () => {
    await fs.writeFile(path.join(sourceDir, "test.txt"), "{{projectName}}");

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "dry-run-project",
      description: "Test project",
      authorName: "Test",
      authorEmail: "test@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config, { dryRun: true });

    // In dry-run mode, no files should be created
    const files = await fs.readdir(targetDir);
    expect(files).toHaveLength(0);
  });

  it("should handle advanced placeholder transformations", async () => {
    const templateContent = `
Project: {{projectName}}
Kebab: {{projectName.kebab}}
Camel: {{projectName.camel}}
Pascal: {{projectName.pascal}}
Snake: {{projectName.snake}}
Upper: {{projectName.upper}}
Lower: {{projectName.lower}}
`;

    await fs.writeFile(path.join(sourceDir, "transformations.txt"), templateContent);

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "My Awesome Project",
      description: "Test project",
      authorName: "Test",
      authorEmail: "test@example.com",
      license: "MIT",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const processedContent = await fs.readFile(
      path.join(targetDir, "transformations.txt"),
      "utf-8"
    );

    expect(processedContent).toContain("Project: My Awesome Project");
    expect(processedContent).toContain("Kebab: my-awesome-project");
    expect(processedContent).toContain("Camel: myAwesomeProject");
    expect(processedContent).toContain("Pascal: MyAwesomeProject");
    expect(processedContent).toContain("Snake: my_awesome_project");
    expect(processedContent).toContain("Upper: MY AWESOME PROJECT");
    expect(processedContent).toContain("Lower: my awesome project");
  });

  it("should process license field in package.json", async () => {
    const packageJsonTemplate = {
      name: "{{projectName}}",
      version: "1.0.0",
      description: "{{description}}",
      author: "{{authorName}} <{{authorEmail}}>",
      license: "ISC",
    };

    await fs.writeFile(
      path.join(sourceDir, "package.json"),
      JSON.stringify(packageJsonTemplate, null, 2)
    );

    const answers: ScaffoldPromptAnswers = {
      template: "test-template",
      projectName: "test-project",
      description: "Test description",
      authorName: "Test Author",
      authorEmail: "test@example.com",
      license: "Apache-2.0",
      outputDirectory: targetDir,
    };

    const config: TemplateConfig = {
      name: "test-template",
      description: "Test template",
      repository: "test-repo",
    };

    await processor.processTemplate(sourceDir, targetDir, answers, config);

    const processedPackageJson = JSON.parse(
      await fs.readFile(path.join(targetDir, "package.json"), "utf-8")
    );

    expect(processedPackageJson.name).toBe("test-project");
    expect(processedPackageJson.license).toBe("Apache-2.0"); // Should be updated
    expect(processedPackageJson.version).toBe("0.1.0"); // Should be reset
    expect(processedPackageJson.description).toBe("Test description");
    expect(processedPackageJson.author).toBe("Test Author <test@example.com>");
  });
});
