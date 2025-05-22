import { Command } from "commander";
import {
  sessionExists,
  parseTmuxTarget,
  buildTmuxTarget,
  executeTmuxCommand,
  TmuxError,
} from "./utils";

export interface WriteOptions {
  target?: string;
  session?: string;
  window?: string;
  pane?: string;
  keys?: string;
  chunk?: number;
  delay?: number;
  verbose?: boolean;
}

const SPECIAL_KEYS = {
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  escape: "Escape",
  space: "Space",
  backspace: "BSpace",
  delete: "Delete",
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  home: "Home",
  end: "End",
  pageup: "PgUp",
  pagedown: "PgDn",
  "ctrl-c": "C-c",
  "ctrl-d": "C-d",
  "ctrl-z": "C-z",
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Send text input to tmux session in chunks
 */
const sendText = async (target: string, text: string, options: WriteOptions): Promise<void> => {
  const chunkSize = options.chunk || 1000;
  const delay = options.delay || 50;

  if (text.length <= chunkSize) {
    // Send all at once if small enough
    const escapedText = text.replace(/'/g, "'\\''");
    executeTmuxCommand(`tmux send-keys -t "${target}" '${escapedText}'`);
    return;
  }

  // Send in chunks
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const escapedChunk = chunk.replace(/'/g, "'\\''");

    if (options.verbose) {
      console.log(
        `Sending chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(text.length / chunkSize)}`
      );
    }

    executeTmuxCommand(`tmux send-keys -t "${target}" '${escapedChunk}'`);

    if (i + chunkSize < text.length) {
      await sleep(delay);
    }
  }
};

/**
 * Send special keys or key combinations to tmux session
 */
const sendKeys = (target: string, keys: string): void => {
  const keySequence = keys
    .split(",")
    .map((key) => key.trim().toLowerCase())
    .map((key) => SPECIAL_KEYS[key as keyof typeof SPECIAL_KEYS] || key)
    .join(" ");

  executeTmuxCommand(`tmux send-keys -t "${target}" ${keySequence}`);
};

/**
 * Main write function
 */
export const writeToTmux = async (text: string, options: WriteOptions): Promise<void> => {
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

    if (options.verbose) {
      console.log(`Writing to tmux target: ${targetStr}`);
    }

    // Send keys if specified
    if (options.keys) {
      sendKeys(targetStr, options.keys);
      return;
    }

    // Send text
    await sendText(targetStr, text, options);

    if (options.verbose) {
      console.log("Write completed successfully");
    }
  } catch (error) {
    if (error instanceof TmuxError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Create write subcommand
 */
export const writeSubcommand = (): Command => {
  const command = new Command("write");

  command.description("Send input to a tmux session");
  command.argument("[text]", "Text to send to the tmux session");
  command.option("-t, --target <target>", "Target session[:window[:pane]]");
  command.option("-s, --session <session>", "Session name");
  command.option("-w, --window <window>", "Window name/number");
  command.option("-p, --pane <pane>", "Pane number");
  command.option("-k, --keys <keys>", "Send special keys (comma-separated)");
  command.option("-c, --chunk <size>", "Chunk size for large text", parseInt);
  command.option("-d, --delay <ms>", "Delay between chunks in milliseconds", parseInt);
  command.option("-v, --verbose", "Verbose output");

  command.action(async (text: string, options: WriteOptions) => {
    if (!text && !options.keys) {
      console.error("Error: Must provide text to send or --keys option");
      process.exit(1);
    }

    await writeToTmux(text, options);
  });

  command.addHelpText(
    "after",
    `
Examples:
  vibe tmux write "echo hello" --session mysession
  vibe tmux write --keys "enter" --target mysession:0
  vibe tmux write "large text..." --chunk 500 --delay 100 -t mysession
  vibe tmux write --keys "ctrl-c,enter" --session mysession
`
  );

  return command;
};
