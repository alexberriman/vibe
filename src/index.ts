#!/usr/bin/env node

import { Command } from "commander";
import { storybookUrlsCommand } from "./commands/storybook-urls/index.js";
import { serverRunCommand } from "./commands/server-run/index.js";
import { reactRoutesCommand } from "./commands/react-routes/index.js";
import { nextjsRoutesCommand } from "./commands/nextjs-routes/index.js";
import { domAuditCommand } from "./commands/dom-audit/index.js";
import { screenshotCommand } from "./commands/screenshot/index.js";
import { designFeedbackCommand } from "./commands/design-feedback/index.js";
import { tmuxCommand } from "./commands/tmux/index.js";
import { openaiCommand } from "./commands/openai/index.js";
import { createScaffoldCommand } from "./commands/scaffold/index.js";

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
program.addCommand(serverRunCommand());
program.addCommand(reactRoutesCommand());
program.addCommand(nextjsRoutesCommand());
program.addCommand(domAuditCommand());
program.addCommand(screenshotCommand());
program.addCommand(designFeedbackCommand());
program.addCommand(tmuxCommand());
program.addCommand(openaiCommand());
program.addCommand(createScaffoldCommand());

// Parse arguments and execute the matching command
program.parse(process.argv);

// If no command is provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
