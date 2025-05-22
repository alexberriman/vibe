#!/usr/bin/env node

import { Command } from "commander";
import { writeSubcommand } from "./write";
import { readSubcommand } from "./read";
import { ensureSubcommand } from "./ensure";

export interface TmuxOptions {
  session?: string;
  window?: string;
  pane?: string;
  verbose?: boolean;
}

export const tmuxCommand = (): Command => {
  const program = new Command("tmux");

  program.description("Tmux session management utilities").version("1.0.0");

  // Add subcommands
  program.addCommand(writeSubcommand());
  program.addCommand(readSubcommand());
  program.addCommand(ensureSubcommand());

  return program;
};
