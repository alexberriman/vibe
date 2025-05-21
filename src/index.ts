#!/usr/bin/env node

import { Command } from "commander";
import { storybookUrlsCommand } from "./commands/storybook-urls/index.js";

// Create the main CLI program
const program = new Command();

// Configure the program
program
  .name("vibe")
  .description("A collection of CLI tools to enhance your coding workflow")
  .version("0.1.3", "-v, --version", "Output the current version")
  .usage("<command> [options]");

// Register commands
program.addCommand(storybookUrlsCommand());

// Parse arguments and execute the matching command
program.parse(process.argv);

// If no command is provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
