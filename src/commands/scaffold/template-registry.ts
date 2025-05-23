/**
 * Template configuration interface
 */
export interface TemplateConfig {
  name: string;
  description: string;
  repository: string;
  branch?: string;
  path?: string;
  prompts?: TemplatePrompt[];
  placeholders?: Record<string, string>;
  postProcessing?: PostProcessingStep[];
  guidance?: string[];
}

/**
 * Template prompt configuration
 */
export interface TemplatePrompt {
  name: string;
  message: string;
  type: "text" | "select" | "confirm" | "number";
  initial?: string | boolean | number;
  choices?: Array<{ title: string; value: string }>;
  validate?: (value: string | boolean | number) => boolean | string;
  format?: (value: string | boolean | number) => string | boolean | number;
}

/**
 * Post-processing step configuration
 */
export interface PostProcessingStep {
  name: string;
  command?: string;
  script?: string;
  description?: string;
}

/**
 * Template metadata stored in the registry
 */
export interface TemplateMetadata {
  name: string;
  description: string;
  repository: string;
  branch?: string;
  path?: string;
  tags?: string[];
  lastUpdated?: Date;
}

/**
 * Template registry for managing project templates
 */
export class TemplateRegistry {
  private templates: Map<string, TemplateMetadata>;

  constructor() {
    this.templates = new Map();
    this.initializeBuiltInTemplates();
  }

  /**
   * Initialize built-in templates
   */
  private initializeBuiltInTemplates(): void {
    // Add vibe-react template
    this.addTemplate({
      name: "vibe-react",
      description: "Modern React application with TypeScript, Vite, and Tailwind CSS",
      repository: "git@github.com:alexberriman/vibe-react.git",
      tags: ["react", "typescript", "vite", "tailwind", "frontend"],
    });

    // Future templates can be added here
    // this.addTemplate({
    //   name: "vibe-node",
    //   description: "Node.js backend with TypeScript, Express, and best practices",
    //   repository: "git@github.com:alexberriman/vibe-node.git",
    //   tags: ["node", "typescript", "express", "backend"],
    // });
  }

  /**
   * Add a template to the registry
   */
  addTemplate(template: TemplateMetadata): void {
    if (!template.name) {
      throw new Error("Template name is required");
    }

    if (!template.repository) {
      throw new Error("Template repository is required");
    }

    // Add timestamp if not provided
    if (!template.lastUpdated) {
      template.lastUpdated = new Date();
    }

    this.templates.set(template.name, template);
  }

  /**
   * Get a template by name
   */
  getTemplate(name: string): TemplateMetadata | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): TemplateMetadata[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a template exists
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Validate template name
   */
  validateTemplateName(name: string): { valid: boolean; error?: string } {
    if (!name) {
      return { valid: false, error: "Template name is required" };
    }

    if (!this.hasTemplate(name)) {
      return { valid: false, error: `Template "${name}" not found` };
    }

    return { valid: true };
  }

  /**
   * Search templates by tags
   */
  searchByTags(tags: string[]): TemplateMetadata[] {
    if (!tags || tags.length === 0) {
      return this.getAllTemplates();
    }

    return this.getAllTemplates().filter((template) => {
      if (!template.tags) return false;
      return tags.some((tag) => template.tags?.includes(tag));
    });
  }

  /**
   * Get template choices for prompts
   */
  getTemplateChoices(): Array<{ title: string; value: string; description: string }> {
    return this.getAllTemplates().map((template) => ({
      title: template.name,
      value: template.name,
      description: template.description,
    }));
  }

  /**
   * Remove a template from the registry
   */
  removeTemplate(name: string): boolean {
    return this.templates.delete(name);
  }

  /**
   * Clear all templates (useful for testing)
   */
  clearTemplates(): void {
    this.templates.clear();
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.size;
  }

  /**
   * Load template configuration from repository
   * This will be implemented when we add support for scaffold.config.json
   */
  async loadTemplateConfig(templateName: string): Promise<TemplateConfig | null> {
    const template = this.getTemplate(templateName);
    if (!template) {
      return null;
    }

    // TODO: Implement loading scaffold.config.json from template repository
    // For now, return a basic config
    return {
      name: template.name,
      description: template.description,
      repository: template.repository,
      branch: template.branch,
      path: template.path,
    };
  }
}

// Create a singleton instance
export const templateRegistry = new TemplateRegistry();

// Export convenience functions
export function getTemplate(name: string): TemplateMetadata | undefined {
  return templateRegistry.getTemplate(name);
}

export function getAllTemplates(): TemplateMetadata[] {
  return templateRegistry.getAllTemplates();
}

export function getTemplateNames(): string[] {
  return templateRegistry.getTemplateNames();
}

export function hasTemplate(name: string): boolean {
  return templateRegistry.hasTemplate(name);
}

export function validateTemplateName(name: string): { valid: boolean; error?: string } {
  return templateRegistry.validateTemplateName(name);
}

export function getTemplateChoices(): Array<{ title: string; value: string; description: string }> {
  return templateRegistry.getTemplateChoices();
}
