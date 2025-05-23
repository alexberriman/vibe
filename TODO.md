# ✅ TODO.md – Vibe tools

A collection of CLI tools to enhance my coding workflow.

---

## scaffold command

Create an interactive CLI tool to scaffold new "vibe coding" projects from templates, with support for non-interactive mode for CI environments.

### Core Functionality

- [x] Set up the command structure (`commands/scaffold/`)
- [ ] Implement basic CLI argument handling using Commander.js with options for non-interactive mode
- [ ] Add interactive prompt library (prompts) for user input
- [ ] Create template registry system for managing multiple project templates
- [ ] Extend existing progress-indicator.ts utility for git clone progress
- [ ] Use pino logger for styled terminal output (already in dependencies)

### Template Management

- [ ] Design template configuration format (template.json or scaffold.config.json in each template repo)
- [ ] Create template registry that maps template names to git repositories
- [ ] Implement template metadata structure (name, description, prompts, placeholders)
- [ ] Build template validation to ensure required files and structure exist
- [ ] Add support for template-specific post-processing scripts
- [ ] Create template caching mechanism to avoid re-cloning frequently used templates

### Interactive Mode

- [ ] Implement template selection prompt (list available templates)
- [ ] Create dynamic prompt system based on template configuration:
  - [ ] Project name prompt with validation (valid npm package name)
  - [ ] Project description prompt
  - [ ] Author name/email prompts (with git config defaults)
  - [ ] License selection prompt
  - [ ] Additional template-specific prompts
- [ ] Build confirmation prompt showing selected options before scaffolding
- [ ] Add directory selection/creation prompt with conflict detection

### Non-Interactive Mode (CI Support)

- [ ] Implement command-line argument parsing for all prompt values
- [ ] Create validation for required arguments in non-interactive mode
- [ ] Add --defaults flag to use sensible defaults for optional prompts
- [ ] Build --dry-run mode to preview changes without execution
- [ ] Implement --force flag to overwrite existing directories

### Scaffolding Process

- [ ] Create temporary directory management for safe operations (use node:fs/promises)
- [ ] Implement git clone functionality with progress tracking:
  - [ ] Use simple-git library for git operations
  - [ ] Add support for specific branch/tag selection
  - [ ] Handle authentication for private repositories
  - [ ] Integrate with existing progress-indicator.ts for clone progress
- [ ] Build file processing engine:
  - [ ] Implement placeholder replacement system ({{projectName}}, {{description}}, etc.)
  - [ ] Create package.json modification logic (name, description, author, etc.)
  - [ ] Add support for renaming files based on project name
  - [ ] Build template file processor for any file type
  - [ ] Use globby (already in dependencies) for file pattern matching
- [ ] Implement README.md generation:
  - [ ] Create default README template with project information
  - [ ] Add sections based on template type
  - [ ] Include getting started instructions
- [ ] Create git repository initialization:
  - [ ] Remove existing .git directory from cloned template
  - [ ] Initialize fresh git repository
  - [ ] Configure git with user information
  - [ ] Stage all files
  - [ ] Create initial commit with --no-verify flag
  - [ ] Use command-runner.ts utility for git commands
- [ ] Add post-processing hooks:
  - [ ] Run npm install if package.json exists
  - [ ] Execute template-specific setup scripts
  - [ ] Display next steps to the user using pino logger

### Error Handling & Recovery

- [ ] Implement basic error handling with descriptive messages
- [ ] Clean up temporary files on error or cancellation

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

- [ ] Create detailed command README.md with usage examples
- [ ] Document template configuration format
- [ ] Add guide for creating new templates
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
