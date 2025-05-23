# 📋 Claude Prompts Directory

## 🎯 Purpose

This directory contains specialized prompts for Claude to handle specific development tasks. Each prompt provides focused instructions for fixing errors, implementing features, and maintaining code quality standards throughout the development lifecycle.

## 📚 Available Prompts

| File | Description |
|------|-------------|
| 🔧 [lint-fix.prompt](./lint-fix.prompt) | Fix ESLint errors by addressing underlying code issues (no suppression) |
| 📝 [typecheck-fix.prompt](./typecheck-fix.prompt) | Resolve TypeScript compilation errors with proper types (no @ts-ignore) |
| 🧪 [test-fix.prompt](./test-fix.prompt) | Fix failing Vitest tests and improve test coverage |
| 🏗️ [build-fix.prompt](./build-fix.prompt) | Resolve build process failures and compilation issues |
| 📖 [storybook-fix.prompt](./storybook-fix.prompt) | Create missing Storybook stories for React components |
| ✅ [next-component-task.prompt](./next-component-task.prompt) | Pick and complete tasks from .tasks.json following best practices |
| 🎉 [library-complete.prompt](./library-complete.prompt) | Final steps for completing component library development |

## 🚀 Usage

These prompts are designed to be used with Claude when specific issues arise:

1. **Error Resolution**: Use fix prompts when encountering specific errors
2. **Task Management**: Use next-component-task for systematic development
3. **Quality Assurance**: Ensure all components have stories and tests
4. **Project Completion**: Use library-complete for final checks

Each prompt enforces project standards and prevents shortcuts like disabling linters or type checking.

---

⚡ *Streamline development with focused, task-specific AI assistance*