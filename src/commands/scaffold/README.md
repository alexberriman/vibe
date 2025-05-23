# Scaffold Command

The scaffold command provides an interactive way to create new projects from pre-configured templates with intelligent prompts, file processing, and automatic setup.

## Table of Contents

- [Quick Start](#quick-start)
- [Usage Modes](#usage-modes)
- [Command Line Options](#command-line-options)
- [Available Templates](#available-templates)
- [Detailed Examples](#detailed-examples)
- [Template Configuration](#template-configuration)
- [Creating Custom Templates](#creating-custom-templates)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Quick Start

Get started with a new project in seconds:

```bash
# Interactive mode - recommended for first-time users
vibe scaffold

# Quick React project with defaults
vibe scaffold --template vibe-react --output my-awesome-app --defaults
```

## Usage Modes

### Interactive Mode (Recommended)

```bash
vibe scaffold
```

**What happens:**
1. **Template Selection** - Choose from available templates with descriptions
2. **Project Configuration** - Answer prompts for project details
3. **Directory Setup** - Choose or create your project directory
4. **Confirmation** - Review your choices before proceeding
5. **Automatic Setup** - Files are processed, dependencies installed, git initialized

**Example interaction:**
```
? Select a template › 
  ❯ Vibe React - Modern React application with TypeScript, Vite, and Tailwind CSS

? Project name (kebab-case) › my-react-app
? Display name (for UI) › My React App
? Project description › A modern React application
? Author name › Alex Berriman
? Author email › alex@example.com
? License › MIT
? Additional features › ◯ React Router ◯ React Query ◯ React Hook Form ◯ Zustand

? Output directory › ./my-react-app
? Confirm: Create "My React App" in ./my-react-app? › Yes

✅ Project scaffolded successfully!
```

### Non-Interactive Mode (CI/Automation)

Perfect for automation, scripts, and when you know exactly what you want:

```bash
vibe scaffold --template vibe-react --output my-project
```

**Required for non-interactive:**
- `--template` - Template name
- `--output` - Output directory

**Optional parameters** will use sensible defaults or be derived from other values.

## Command Line Options

| Option | Short | Type | Description |
|--------|-------|------|-------------|
| `--template` | `-t` | string | Template name (required for non-interactive) |
| `--output` | `-o` | string | Output directory path |
| `--force` | `-f` | boolean | Overwrite existing directory |
| `--defaults` | | boolean | Use default values for all optional prompts |
| `--dry-run` | | boolean | Preview changes without executing |
| `--project-name` | | string | Set project name (non-interactive) |
| `--description` | | string | Set project description (non-interactive) |
| `--author-name` | | string | Set author name (non-interactive) |
| `--author-email` | | string | Set author email (non-interactive) |
| `--license` | | string | Set license (MIT, Apache-2.0, GPL-3.0, ISC, Unlicense) |
| `--features` | | string | Comma-separated list of features |
| `--help` | `-h` | boolean | Show help information |

## Available Templates

### vibe-react

**Modern React Application Stack**

- ⚡ **Vite** - Lightning fast build tool and dev server
- ⚛️ **React 18** - Latest React with modern features  
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework
- 📚 **Storybook** - Component documentation and development
- 🧪 **Vitest** - Fast unit testing with browser mode
- 🎭 **Playwright** - End-to-end testing
- 📝 **TypeScript** - Full type safety
- 🎯 **ESLint + Prettier** - Code quality and formatting
- 🪝 **Husky** - Git hooks for quality gates
- 🎪 **Shadcn/ui** - Beautiful, accessible UI components

**Optional Features:**
- React Router for routing
- React Query for data fetching
- React Hook Form for forms
- Zustand for state management

## Detailed Examples

### Example 1: Complete Interactive Workflow

```bash
$ vibe scaffold

✨ Welcome to Vibe Scaffold!

? Select a template › 
  ❯ Vibe React - Modern React application with TypeScript, Vite, and Tailwind CSS

? Project name (kebab-case) › awesome-dashboard
? Display name (for UI) › Awesome Dashboard
? Project description › A beautiful admin dashboard with modern UI
? Author name › Alex Berriman
? Author email › alex@example.com
? License › MIT
? Additional features › ◉ React Router ◉ React Query ◯ React Hook Form ◯ Zustand

? Output directory › ./awesome-dashboard
? Confirm: Create "Awesome Dashboard" in ./awesome-dashboard? › Yes

🔄 Cloning template from git@github.com:alexberriman/vibe-react.git...
✅ Template cloned successfully

🔄 Processing template files...
✅ Processed 25 files with placeholders

🔄 Installing dependencies...
✅ Dependencies installed successfully

🔄 Initializing git repository...
✅ Git repository initialized

🔄 Running type check...
✅ Type check passed

🎉 Project "Awesome Dashboard" created successfully!

📋 Next Steps:
   cd awesome-dashboard
   npm run dev          # Start development server
   npm run storybook    # Start Storybook
   npm run test         # Run tests
   npm run build        # Build for production

🚀 Happy coding!
```

### Example 2: Non-Interactive with All Parameters

```bash
vibe scaffold \
  --template vibe-react \
  --output ./my-startup \
  --project-name "my-startup" \
  --description "The next big thing in SaaS" \
  --author-name "John Doe" \
  --author-email "john@startup.com" \
  --license MIT \
  --features "router,query,forms"
```

### Example 3: Quick Project with Defaults

```bash
# Uses git config for author info, MIT license, no extra features
vibe scaffold --template vibe-react --output ./quick-project --defaults
```

### Example 4: Preview Mode (Dry Run)

```bash
vibe scaffold --template vibe-react --output ./preview-project --dry-run

📋 Dry Run Preview:

Template: vibe-react
Output: ./preview-project
Project Name: preview-project
Display Name: Preview Project
Description: A modern React application
Author: Alex Berriman <alex@example.com>
License: MIT
Features: None

📁 Files that would be created:
├── package.json (modified)
├── README.md (generated from template)
├── src/
│   ├── app.tsx (processed)
│   ├── main.tsx (processed)
│   └── ...
├── vite.config.ts (processed)
└── ... (23 more files)

🔧 Commands that would run:
1. npm install
2. npm run typecheck

ℹ️  No files were created (dry run mode)
```

### Example 5: Overwriting Existing Directory

```bash
# Will prompt for confirmation before overwriting
vibe scaffold --template vibe-react --output ./existing-project

# Force overwrite without confirmation
vibe scaffold --template vibe-react --output ./existing-project --force
```

## Template Configuration

Templates use a `scaffold.config.json` file to define their behavior:

```json
{
  "name": "vibe-react",
  "displayName": "Vibe React",
  "description": "Modern React application with TypeScript, Vite, and Tailwind CSS",
  "prompts": [
    {
      "name": "projectName",
      "type": "text",
      "message": "Project name (kebab-case)",
      "validate": "^[a-z][a-z0-9-]*$"
    }
  ],
  "placeholders": {
    "{{projectName}}": "projectName",
    "{{displayName}}": "displayName"
  },
  "postProcessing": {
    "steps": [
      {
        "type": "command",
        "command": "npm install",
        "description": "Installing dependencies..."
      }
    ]
  }
}
```

### Template Structure

```
my-template/
├── scaffold.config.json     # Template configuration
├── README.template.md       # README template for generated projects
├── package.json            # Will be processed for placeholders
├── src/
│   └── *.tsx              # Source files with placeholders
└── .gitignore             # Should exclude scaffold.config.json
```

### Placeholder Processing

The scaffold command processes files and replaces placeholders:

**Input file (app.tsx):**
```tsx
function {{displayName}}() {
  return <h1>Welcome to {{displayName}}!</h1>;
}
```

**Output file (app.tsx):**
```tsx
function MyAwesomeApp() {
  return <h1>Welcome to My Awesome App!</h1>;
}
```

### Supported Transformations

- `{{projectName | camelCase}}` → `myAwesomeApp`
- `{{projectName | pascalCase}}` → `MyAwesomeApp`
- `{{projectName | kebabCase}}` → `my-awesome-app`
- `{{projectName | snakeCase}}` → `my_awesome_app`
- `{{projectName | upperCase}}` → `MY-AWESOME-APP`
- `{{now | year}}` → `2024`
- `{{now | date}}` → `2024-01-15`

## Creating Custom Templates

### Step 1: Create Template Repository

```bash
git clone git@github.com:your-username/my-template.git
cd my-template
```

### Step 2: Add Template Configuration

Create `scaffold.config.json`:

```json
{
  "name": "my-template",
  "displayName": "My Custom Template",
  "description": "A custom template for my specific needs",
  "prompts": [
    {
      "name": "projectName",
      "type": "text",
      "message": "Project name",
      "validate": "^[a-z][a-z0-9-]*$"
    },
    {
      "name": "useDatabase",
      "type": "confirm",
      "message": "Include database setup?"
    }
  ],
  "placeholders": {
    "{{projectName}}": "projectName",
    "{{useDatabase}}": "useDatabase"
  },
  "postProcessing": {
    "steps": [
      {
        "type": "command",
        "command": "npm install"
      }
    ]
  }
}
```

### Step 3: Add Placeholders to Files

Update your template files with placeholders:

**package.json:**
```json
{
  "name": "{{projectName}}",
  "description": "{{description}}"
}
```

### Step 4: Update .gitignore

Exclude scaffold files from generated projects:

```gitignore
# Scaffold template files
scaffold.config.json
README.template.md
```

### Step 5: Register Template

Add your template to the scaffold command's template registry.

## Advanced Usage

### Environment Variable Support

Set defaults via environment variables:

```bash
export VIBE_AUTHOR_NAME="Your Name"
export VIBE_AUTHOR_EMAIL="your@email.com"
export VIBE_DEFAULT_LICENSE="MIT"

vibe scaffold --template vibe-react --defaults
```

### Custom Template Sources

Use templates from different sources:

```bash
# From specific branch
vibe scaffold --template vibe-react@develop

# From specific commit
vibe scaffold --template vibe-react@abc1234

# From different repository (if configured)
vibe scaffold --template my-org/my-template
```

### Batch Project Creation

Create multiple projects with a script:

```bash
#!/bin/bash
for app in frontend backend admin; do
  vibe scaffold \
    --template vibe-react \
    --output "./$app" \
    --project-name "$app" \
    --defaults
done
```

### Template Development Workflow

```bash
# 1. Clone your template for development
git clone git@github.com:your-username/my-template.git

# 2. Make changes to template

# 3. Test locally with dry run
vibe scaffold --template ./my-template --dry-run

# 4. Test actual creation
vibe scaffold --template ./my-template --output ./test-output

# 5. Commit and push changes
git add . && git commit -m "feat: add new feature"
git push origin main
```

## Troubleshooting

### Common Issues

**❌ Template not found**
```
Error: Template 'my-template' not found
```
**Solution:** Check template name spelling and ensure it's registered in the template registry.

**❌ Git authentication failed**
```
Error: Authentication failed for template repository
```
**Solution:** Ensure SSH keys are set up for GitHub, or use HTTPS URLs for public repos.

**❌ Directory already exists**
```
Error: Directory './my-project' already exists
```
**Solution:** Use `--force` flag or choose a different output directory.

**❌ Invalid project name**
```
Error: Project name must match pattern ^[a-z][a-z0-9-]*$
```
**Solution:** Use kebab-case names starting with a letter (e.g., `my-project-123`).

**❌ npm install failed**
```
Error: npm install failed with exit code 1
```
**Solution:** Check Node.js version compatibility, clear npm cache, or use different package manager.

### Debug Mode

Enable detailed logging:

```bash
DEBUG=vibe:scaffold vibe scaffold --template vibe-react
```

### Getting Help

```bash
# Show command help
vibe scaffold --help

# Show available templates
vibe scaffold --list-templates

# Show template details
vibe scaffold --template vibe-react --info
```

### Reporting Issues

If you encounter issues:

1. Enable debug mode and capture output
2. Include your environment details (Node.js version, OS)
3. Share the exact command that failed
4. Create an issue at [GitHub Issues](https://github.com/alexberriman/vibe/issues)

---

**Need more help?** Check out the [main documentation](../../README.md) or create an issue on GitHub.