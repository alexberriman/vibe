# Husky Scripts for Claude Control

This directory contains a collection of bash scripts used by claude-control to configure and manage git hooks through Husky.

## Overview

These scripts work together to enforce code quality standards and development workflows by integrating with git hooks at various stages of the commit process.

## Scripts

- **check-unstaged-files.sh** - Verifies unstaged files before commits
- **check.sh** - General validation checks
- **commit-msg-claude.sh** - Validates commit messages against project conventions
- **eslint-config-violation.sh** - Handles ESLint configuration violations
- **husky-changes.sh** - Tracks changes to Husky configuration
- **mainline-development.sh** - Enforces mainline development practices
- **post-commit-push.sh** - Handles post-commit push operations
- **precommit-claude-commit-message.sh** - Pre-commit validation for Claude-generated commits
- **prepare-commit-claude.sh** - Prepares commits with Claude-specific formatting
- **typescript-violation.sh** - Handles TypeScript type checking violations

## Usage

These scripts are automatically invoked by Husky during git operations. They should not be run manually unless debugging specific hook behaviors.