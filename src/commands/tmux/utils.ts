import { execSync } from "node:child_process";

export interface TmuxSession {
  name: string;
  windows: number;
  attached: boolean;
}

export interface TmuxTarget {
  session: string;
  window?: string;
  pane?: string;
}

export class TmuxError extends Error {
  constructor(
    message: string,
    public code?: number
  ) {
    super(message);
    this.name = "TmuxError";
  }
}

/**
 * Check if tmux is installed and available
 */
export const isTmuxAvailable = (): boolean => {
  try {
    execSync("tmux -V", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

/**
 * Get list of all tmux sessions
 */
export const getTmuxSessions = (): TmuxSession[] => {
  if (!isTmuxAvailable()) {
    throw new TmuxError("Tmux is not installed or not available in PATH");
  }

  try {
    const output = execSync(
      "tmux list-sessions -F '#{session_name}:#{session_windows}:#{session_attached}'",
      {
        encoding: "utf8",
      }
    );

    return output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const [name, windows, attached] = line.split(":");
        return {
          name,
          windows: parseInt(windows, 10),
          attached: attached === "1",
        };
      });
  } catch (error) {
    if (error instanceof Error && error.message.includes("no server running")) {
      return [];
    }
    throw new TmuxError("Failed to list tmux sessions");
  }
};

/**
 * Check if a specific tmux session exists
 */
export const sessionExists = (sessionName: string): boolean => {
  const sessions = getTmuxSessions();
  return sessions.some((session) => session.name === sessionName);
};

/**
 * Validate and parse tmux target specification
 */
export const parseTmuxTarget = (target: string): TmuxTarget => {
  const parts = target.split(":");

  if (parts.length === 1) {
    // Just session name
    return { session: parts[0] };
  } else if (parts.length === 2) {
    // session:window
    return { session: parts[0], window: parts[1] };
  } else if (parts.length === 3) {
    // session:window.pane
    return { session: parts[0], window: parts[1], pane: parts[2] };
  }

  throw new TmuxError(`Invalid tmux target format: ${target}. Use session[:window[:pane]]`);
};

/**
 * Build tmux target string for commands
 */
export const buildTmuxTarget = (target: TmuxTarget): string => {
  let targetStr = target.session;

  if (target.window) {
    targetStr += `:${target.window}`;
  }

  if (target.pane) {
    targetStr += `.${target.pane}`;
  }

  return targetStr;
};

/**
 * Execute tmux command safely
 */
export const executeTmuxCommand = (command: string): string => {
  try {
    return execSync(command, { encoding: "utf8" });
  } catch (error) {
    if (error instanceof Error) {
      throw new TmuxError(`Tmux command failed: ${error.message}`);
    }
    throw new TmuxError("Unknown tmux command error");
  }
};
