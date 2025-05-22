import { Command } from "commander";
import { sessionExists, executeTmuxCommand, TmuxError } from "./utils";

export interface EnsureOptions {
  session?: string;
  directory?: string;
  command?: string;
  silent?: boolean;
  verbose?: boolean;
}

/**
 * Create a new tmux session
 */
const createSession = (sessionName: string, directory?: string, command?: string): void => {
  let tmuxCommand = `tmux new-session -d -s "${sessionName}"`;

  if (directory) {
    tmuxCommand += ` -c "${directory}"`;
  }

  if (command) {
    tmuxCommand += ` "${command}"`;
  }

  executeTmuxCommand(tmuxCommand);
};

/**
 * Main ensure function
 */
export const ensureTmuxSession = (options: EnsureOptions): boolean => {
  try {
    const { session, directory, command, silent, verbose } = options;

    if (!session) {
      throw new TmuxError("Session name is required");
    }

    if (sessionExists(session)) {
      if (verbose) {
        console.log(`Session '${session}' already exists`);
      }
      return false; // Session already existed
    }

    if (verbose) {
      console.log(`Creating session '${session}'`);
      if (directory) {
        console.log(`  Working directory: ${directory}`);
      }
      if (command) {
        console.log(`  Initial command: ${command}`);
      }
    }

    createSession(session, directory, command);

    if (!silent && !verbose) {
      console.log(`Created tmux session '${session}'`);
    } else if (verbose) {
      console.log(`Session '${session}' created successfully`);
    }

    return true; // Session was created
  } catch (error) {
    if (error instanceof TmuxError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Create ensure subcommand
 */
export const ensureSubcommand = (): Command => {
  const command = new Command("ensure");

  command.description("Ensure a tmux session exists (create if it doesn't)");
  command.argument("<session>", "Name of the tmux session");
  command.option("-d, --directory <path>", "Working directory for new session");
  command.option("-c, --command <cmd>", "Initial command to run in new session");
  command.option("-s, --silent", "No output if session already exists");
  command.option("-v, --verbose", "Detailed status reporting");

  command.action((session: string, options: EnsureOptions) => {
    ensureTmuxSession({ ...options, session });
  });

  command.addHelpText(
    "after",
    `
Examples:
  vibe tmux ensure mysession
  vibe tmux ensure dev --directory ~/projects/myapp
  vibe tmux ensure server --command "npm run dev"
  vibe tmux ensure build --directory ~/project --command "npm run build"
  vibe tmux ensure logs --silent
`
  );

  return command;
};
