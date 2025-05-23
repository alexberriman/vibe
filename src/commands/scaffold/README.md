# Scaffold Command

The scaffold command provides an interactive way to create new projects from templates.

## Usage

### Interactive Mode

```bash
vibe scaffold
```

This will prompt you to:
1. Select a template from available options
2. Enter project details (name, description, author)
3. Choose an output directory
4. Configure project-specific options

### Non-Interactive Mode

```bash
vibe scaffold --template vibe-react --output my-project
```

## Options

- `-t, --template <name>` - Specify template to use (non-interactive mode)
- `-o, --output <path>` - Output directory (defaults to current directory)
- `-f, --force` - Overwrite existing directory
- `--defaults` - Use default values for optional prompts
- `--dry-run` - Preview changes without executing

## Available Templates

- `vibe-react` - Modern React application with TypeScript, Vite, and Tailwind CSS

## Examples

### Create a new React project interactively

```bash
vibe scaffold
```

### Create a React project with defaults

```bash
vibe scaffold --template vibe-react --output my-app --defaults
```

### Preview what would be created

```bash
vibe scaffold --template vibe-react --dry-run
```

## Template Configuration

Templates are configured with a `scaffold.config.json` file that defines:

- Template metadata (name, description)
- User prompts and their validation
- File placeholders for dynamic content
- Post-processing steps

## Creating Custom Templates

To create a custom template:

1. Create a git repository with your template code
2. Add a `scaffold.config.json` file at the root
3. Define placeholders in your files (e.g., `{{projectName}}`)
4. Register your template in the scaffold command

See the [template documentation](./templates.md) for detailed instructions.