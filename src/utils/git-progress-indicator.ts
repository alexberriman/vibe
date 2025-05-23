import { createLogger } from "./logger.js";
import type { Logger } from "pino";

type GitProgressIndicatorOptions = {
  readonly title?: string;
  readonly logger?: Logger;
  readonly showSpinner?: boolean;
  readonly clearLine?: boolean;
};

type GitCloneProgress = {
  readonly stage:
    | "Counting objects"
    | "Compressing objects"
    | "Receiving objects"
    | "Resolving deltas";
  readonly percent?: number;
  readonly current?: number;
  readonly total?: number;
  readonly throughput?: string;
};

/**
 * Progress indicator specifically designed for git operations
 * Supports both determinate (with percentage) and indeterminate progress
 */
export class GitProgressIndicator {
  private title: string;
  private logger: Logger;
  private showSpinner: boolean;
  private clearLine: boolean;
  private spinnerFrames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
  private spinnerIndex = 0;
  private lastMessage = "";
  private isCompleted = false;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor({
    title = "Git operation",
    logger = createLogger({ pretty: true }),
    showSpinner = true,
    clearLine = process.stdout.isTTY || false,
  }: GitProgressIndicatorOptions = {}) {
    this.title = title;
    this.logger = logger;
    this.showSpinner = showSpinner;
    this.clearLine = clearLine;
  }

  /**
   * Start showing indeterminate progress with a spinner
   */
  startIndeterminate(message = "Processing..."): void {
    if (this.isCompleted) return;

    if (this.showSpinner && this.clearLine) {
      this.intervalId = setInterval(() => {
        this.renderIndeterminate(message);
      }, 100);
    } else {
      this.logger.info(`${this.title}: ${message}`);
    }
  }

  /**
   * Stop the indeterminate progress spinner
   */
  stopIndeterminate(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.clearCurrentLine();
    }
  }

  /**
   * Update progress for git clone operations
   */
  updateGitClone(progress: GitCloneProgress): void {
    if (this.isCompleted) return;

    this.stopIndeterminate();

    let message = `${progress.stage}`;

    if (progress.percent !== undefined) {
      message += `: ${progress.percent}%`;
    }

    if (progress.current !== undefined && progress.total !== undefined) {
      message += ` (${progress.current}/${progress.total})`;
    }

    if (progress.throughput) {
      message += `, ${progress.throughput}`;
    }

    this.render(message);
  }

  /**
   * Update with a simple message (no progress bar)
   */
  updateMessage(message: string): void {
    if (this.isCompleted) return;

    this.stopIndeterminate();
    this.render(message);
  }

  /**
   * Mark the operation as complete
   */
  complete(message?: string): void {
    this.stopIndeterminate();
    this.isCompleted = true;

    if (this.clearLine) {
      this.clearCurrentLine();
    }

    const finalMessage = message || `${this.title} completed`;
    this.logger.info(finalMessage);
  }

  /**
   * Mark the operation as failed
   */
  fail(error: string): void {
    this.stopIndeterminate();
    this.isCompleted = true;

    if (this.clearLine) {
      this.clearCurrentLine();
    }

    this.logger.error(`${this.title} failed: ${error}`);
  }

  /**
   * Parse git clone progress output
   * Git clone progress typically looks like:
   * "Receiving objects: 100% (1234/1234), 1.23 MiB | 1.00 MiB/s, done."
   */
  static parseGitProgress(line: string): GitCloneProgress | null {
    // Match patterns for different git progress stages
    const patterns = [
      {
        regex: /Counting objects:\s*(\d+)%(?:\s*\((\d+)\/(\d+)\))?/,
        stage: "Counting objects" as const,
      },
      {
        regex: /Compressing objects:\s*(\d+)%(?:\s*\((\d+)\/(\d+)\))?/,
        stage: "Compressing objects" as const,
      },
      {
        regex: /Receiving objects:\s*(\d+)%(?:\s*\((\d+)\/(\d+)\))?,?\s*(.+)?/,
        stage: "Receiving objects" as const,
      },
      {
        regex: /Resolving deltas:\s*(\d+)%(?:\s*\((\d+)\/(\d+)\))?/,
        stage: "Resolving deltas" as const,
      },
    ];

    for (const { regex, stage } of patterns) {
      const match = line.match(regex);
      if (!match) continue;

      // Handle throughput extraction for receiving objects
      const throughput =
        stage === "Receiving objects" && match[4] ? this.extractThroughput(match[4]) : undefined;

      const progress: GitCloneProgress = {
        stage,
        percent: match[1] ? parseInt(match[1], 10) : undefined,
        current: match[2] ? parseInt(match[2], 10) : undefined,
        total: match[3] ? parseInt(match[3], 10) : undefined,
        ...(throughput && { throughput }),
      };

      return progress;
    }

    return null;
  }

  /**
   * Extract throughput information from git progress text
   */
  private static extractThroughput(text: string): string | undefined {
    // Look for throughput pattern (e.g., "1.23 MiB | 2.45 MiB/s")
    // Prefer the rate (with /s) over the total size
    const rateMatch = text.match(/(\d+\.\d+\s*[KMG]iB\/s)/);
    if (rateMatch) return rateMatch[1];

    // Fall back to size without rate
    const sizeMatch = text.match(/(\d+\.\d+\s*[KMG]iB)/);
    return sizeMatch ? sizeMatch[1] : undefined;
  }

  /**
   * Render the progress message
   */
  private render(message: string): void {
    const fullMessage = `${this.title}: ${message}`;

    if (this.clearLine) {
      this.clearCurrentLine();
      process.stdout.write(fullMessage);
      this.lastMessage = fullMessage;
    } else {
      // When not in TTY mode, use logger
      this.logger.info(fullMessage);
    }
  }

  /**
   * Render indeterminate progress with spinner
   */
  private renderIndeterminate(message: string): void {
    if (!this.clearLine) return;

    const spinner = this.spinnerFrames[this.spinnerIndex];
    this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;

    const fullMessage = `${spinner} ${this.title}: ${message}`;

    this.clearCurrentLine();
    process.stdout.write(fullMessage);
    this.lastMessage = fullMessage;
  }

  /**
   * Clear the current line in the terminal
   */
  private clearCurrentLine(): void {
    if (!this.clearLine) return;

    process.stdout.write("\r");
    process.stdout.write(" ".repeat(this.lastMessage.length));
    process.stdout.write("\r");
  }
}
