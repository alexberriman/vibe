# ✅ TODO.md – Vibe tools

A collection of CLI tools to enhance my coding workflow.

---

## scaffold command

Create an interactive CLI tool to scaffold new "vibe coding" projects from templates, with support for non-interactive mode for CI environments.

### Core Functionality

- [x] Set up the command structure (`commands/scaffold/`)
- [x] Implement basic CLI argument handling using Commander.js with options for non-interactive mode
- [x] Add interactive prompt library (prompts) for user input
- [x] Create template registry system for managing multiple project templates
- [x] Extend existing progress-indicator.ts utility for git clone progress
- [x] Use pino logger for styled terminal output (already in dependencies)

### Template Management

- [x] Design template configuration format (template.json or scaffold.config.json in each template repo)
- [x] Create template registry that maps template names to git repositories
- [x] Implement template metadata structure (name, description, prompts, placeholders)
- [x] Build template validation to ensure required files and structure exist

### Interactive Mode

- [x] Implement template selection prompt (list available templates)
- [x] Create dynamic prompt system based on template configuration:
  - [x] Project name prompt with validation (valid npm package name)
  - [x] Project description prompt
  - [x] Author name/email prompts (with git config defaults)
  - [x] License selection prompt
- [x] Build confirmation prompt showing selected options before scaffolding
- [x] Add directory selection/creation prompt with conflict detection

### Non-Interactive Mode (CI Support)

- [x] Implement command-line argument parsing for all prompt values
- [x] Create validation for required arguments in non-interactive mode
- [x] Add --defaults flag to use sensible defaults for optional prompts
- [x] Build --dry-run mode to preview changes without execution
- [x] Implement --force flag to overwrite existing directories

### Scaffolding Process

- [x] Create temporary directory management for safe operations (use node:fs/promises)
- [x] Implement git clone functionality with progress tracking:
  - [x] Use simple-git library for git operations
  - [x] Add support for specific branch/tag selection
  - [x] Handle authentication for private repositories
  - [x] Integrate with existing progress-indicator.ts for clone progress
- [x] Build file processing engine:
  - [x] Implement placeholder replacement system ({{projectName}}, {{description}}, etc.)
  - [x] Create package.json modification logic (name, description, author, license, etc.)
  - [x] Add support for renaming files based on project name
  - [x] Build template file processor for any file type
  - [x] Use globby (already in dependencies) for file pattern matching
  - [x] Add advanced placeholder transformations (kebab-case, camelCase, PascalCase, snake_case, etc.)
- [x] Implement README.md generation:
  - [x] Create default README template with project information
  - [x] Add sections based on template type (React vs Node.js)
  - [x] Include getting started instructions
  - [x] Generate professional project structure documentation
  - [x] Include contributing guidelines and license information
  - [x] Respect existing README.md files (no overwriting)
- [x] Create git repository initialization:
  - [x] Remove existing .git directory from cloned template
  - [x] Initialize fresh git repository
  - [x] Configure git with user information
  - [x] Stage all files
  - [x] Create initial commit with --no-verify flag
  - [x] Use command-runner.ts utility for git commands
- [x] Add post-processing hooks:
  - [x] Run npm install if package.json exists (smart detection)
  - [x] Execute template-specific setup scripts
  - [x] Display smart next steps to the user with template-specific guidance
  - [x] Detect project type (React, Next.js, Node.js) for customized instructions
  - [x] Include Docker, Storybook, and other tool guidance when detected

### Error Handling & Recovery

- [x] Implement comprehensive error handling with descriptive messages
- [x] Clean up temporary files on error or cancellation

### Current Templates

- [ ] Configure vibe-react template:
  - [ ] Repository: git@github.com:alexberriman/vibe-react.git
  - [ ] Create /Users/alexberriman/Documents/personal/vibe-react/scaffold.config.json with:
    - [ ] Template metadata (name, description)
    - [ ] Define prompts (projectName, description, author)
    - [ ] Specify placeholder mappings for file processing
    - [ ] Configure post-processing steps (npm install, etc.)
  - [ ] Update /Users/alexberriman/Documents/personal/vibe-react/.gitignore to exclude scaffold-specific files
  - [ ] Create /Users/alexberriman/Documents/personal/vibe-react/README.template.md for generated projects

### Documentation

- [ ] Create detailed nested command README.md with usage examples
- [ ] Update root README.md with scaffold command information

### Dependencies to Add

```json
{
  "prompts": "^2.4.2", // Interactive CLI prompts (lighter than inquirer)
  "simple-git": "^3.27.0" // Git operations (no existing git library in project)
}
```

### Leverage Existing Dependencies

- **pino + pino-pretty**: Already used for styled terminal output (no need for chalk)
- **globby**: Already available for file pattern matching operations
- **commander**: Already used for CLI argument parsing
- **progress-indicator.ts**: Existing custom progress bar utility (no need for ora)
- **command-runner.ts**: Existing utility for running shell commands
- **node:fs/promises**: Use built-in Node.js file operations (no need for fs-extra)
