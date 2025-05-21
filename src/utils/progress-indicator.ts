import { createLogger } from "./logger.js";
import type { Logger } from "pino";

type ProgressIndicatorOptions = {
  readonly total: number;
  readonly title?: string;
  readonly width?: number;
  readonly logger?: Logger;
  readonly showPercentage?: boolean;
  readonly showCount?: boolean;
};

/**
 * A simple CLI progress indicator
 */
export class ProgressIndicator {
  private current = 0;
  private total: number;
  private title: string;
  private width: number;
  private logger: Logger;
  private showPercentage: boolean;
  private showCount: boolean;
  private startTime: number;

  constructor({
    total,
    title = "Progress",
    width = 30,
    logger = createLogger({ pretty: true }),
    showPercentage = true,
    showCount = true,
  }: ProgressIndicatorOptions) {
    this.total = total;
    this.title = title;
    this.width = width;
    this.logger = logger;
    this.showPercentage = showPercentage;
    this.showCount = showCount;
    this.startTime = Date.now();
  }

  /**
   * Increment the progress by a specified amount
   */
  increment(amount = 1): void {
    this.current = Math.min(this.total, this.current + amount);
    this.render();
  }

  /**
   * Update to a specific progress value
   */
  update(value: number): void {
    this.current = Math.max(0, Math.min(this.total, value));
    this.render();
  }

  /**
   * Set the progress to 100% and mark as complete
   */
  complete(): void {
    this.current = this.total;
    this.render();
    this.logger.info(`${this.title} completed in ${this.getElapsedTimeString()}`);
  }

  /**
   * Set a new total value
   */
  setTotal(total: number): void {
    this.total = total;
    this.current = Math.min(this.current, this.total);
    this.render();
  }

  /**
   * Reset the progress indicator
   */
  reset(): void {
    this.current = 0;
    this.startTime = Date.now();
    this.render();
  }

  /**
   * Get the current progress as a percentage
   */
  getPercentage(): number {
    if (this.total === 0) return 100;
    return Math.round((this.current / this.total) * 100);
  }

  /**
   * Get the elapsed time in a readable format
   */
  private getElapsedTimeString(): string {
    const elapsed = Date.now() - this.startTime;
    if (elapsed < 1000) {
      return `${elapsed}ms`;
    }
    return `${(elapsed / 1000).toFixed(2)}s`;
  }

  /**
   * Render the progress bar to the console
   */
  private render(): void {
    const percent = this.getPercentage();
    const filledWidth = Math.round((percent / 100) * this.width);
    const emptyWidth = this.width - filledWidth;

    const bar = `[${"=".repeat(filledWidth)}${" ".repeat(emptyWidth)}]`;

    let status = bar;

    if (this.showPercentage) {
      status += ` ${percent}%`;
    }

    if (this.showCount) {
      status += ` (${this.current}/${this.total})`;
    }

    // Use debug level to avoid cluttering logs with progress updates
    this.logger.debug(`${this.title}: ${status}`);

    // If running in TTY mode, we could clear the line and update in place
    // For simplicity, we're just logging each update
  }
}
