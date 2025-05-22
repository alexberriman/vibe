import { Command } from "commander";
import {
  sessionExists,
  parseTmuxTarget,
  buildTmuxTarget,
  executeTmuxCommand,
  TmuxError,
} from "./utils";

export interface ReadOptions {
  target?: string;
  session?: string;
  window?: string;
  pane?: string;
  lines?: number;
  raw?: boolean;
  verbose?: boolean;
}

/**
 * Tidy captured content by removing unnecessary whitespace and empty lines
 */
const tidyContent = (content: string): string => {
  return content
    .split("\n")
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .reduce((acc: string[], line: string, _index: number, _lines: string[]) => {
      // Skip consecutive empty lines (keep only one)
      if (line === "" && acc.length > 0 && acc[acc.length - 1] === "") {
        return acc;
      }

      // Skip leading empty lines
      if (line === "" && acc.length === 0) {
        return acc;
      }

      acc.push(line);
      return acc;
    }, [])
    .join("\n")
    .trim(); // Remove leading/trailing whitespace from entire content
};

/**
 * Capture content from tmux pane
 */
const captureContent = (target: string, lines: number): string => {
  const command = `tmux capture-pane -t "${target}" -p -S -${lines}`;
  return executeTmuxCommand(command);
};

/**
 * Main read function
 */
export const readFromTmux = (options: ReadOptions): string => {
  try {
    // Determine target
    let targetStr: string;
    if (options.target) {
      const target = parseTmuxTarget(options.target);
      targetStr = buildTmuxTarget(target);
    } else if (options.session) {
      const target = {
        session: options.session,
        window: options.window,
        pane: options.pane,
      };
      targetStr = buildTmuxTarget(target);
    } else {
      throw new TmuxError("Must specify target session");
    }

    // Check if session exists
    const sessionName = targetStr.split(":")[0];
    if (!sessionExists(sessionName)) {
      throw new TmuxError(`Session '${sessionName}' does not exist`);
    }

    const lineCount = options.lines || 100;

    if (options.verbose) {
      console.log(`Reading ${lineCount} lines from tmux target: ${targetStr}`);
    }

    // Capture content
    const content = captureContent(targetStr, lineCount);

    // Return raw or tidied content
    const result = options.raw ? content : tidyContent(content);

    if (options.verbose) {
      console.log(`Read ${result.split("\n").length} lines of content`);
    }

    return result;
  } catch (error) {
    if (error instanceof TmuxError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Create read subcommand
 */
export const readSubcommand = (): Command => {
  const command = new Command("read");

  command.description("Read and tidy the contents of a tmux session pane");
  command.option("-t, --target <target>", "Target session[:window[:pane]]");
  command.option("-s, --session <session>", "Session name");
  command.option("-w, --window <window>", "Window name/number");
  command.option("-p, --pane <pane>", "Pane number");
  command.option("-l, --lines <count>", "Number of lines to capture", parseInt);
  command.option("-r, --raw", "Output raw content without tidying");
  command.option("-v, --verbose", "Verbose output");

  command.action((options: ReadOptions) => {
    const content = readFromTmux(options);
    console.log(content);
  });

  command.addHelpText(
    "after",
    `
Examples:
  vibe tmux read --session mysession
  vibe tmux read --target mysession:0.1 --lines 50
  vibe tmux read --session mysession --raw
  vibe tmux read -t mysession -l 200 --verbose
`
  );

  return command;
};
